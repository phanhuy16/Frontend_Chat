import { CallType } from "../types";

export class WebRTCService {
  private peerConnections: Map<number, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStreams: Map<number, MediaStream> = new Map();
  private config: RTCConfiguration = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["stun:stun1.l.google.com:19302"] },
      { urls: ["stun:stun2.l.google.com:19302"] },
      { urls: ["stun:stun3.l.google.com:19302"] },
      { urls: ["stun:stun4.l.google.com:19302"] },
    ],
  };

  private candidateQueues: Map<number, RTCIceCandidate[]> = new Map();

  // Callbacks
  onRemoteStreamReceived?: (userId: number, stream: MediaStream) => void;
  onRemoteStreamRemoved?: (userId: number) => void;
  onIceCandidateFound?: (userId: number, candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (userId: number, state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (userId: number, state: RTCIceConnectionState) => void;

  // Initialize peer connection for a specific user
  async initPeerConnection(userId: number): Promise<RTCPeerConnection> {
    try {
      if (this.peerConnections.has(userId)) {
        return this.peerConnections.get(userId)!;
      }

      const pc = new RTCPeerConnection(this.config);
      this.peerConnections.set(userId, pc);

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.localStream) {
            pc.addTrack(track, this.localStream);
          }
        });
      }

      this.setupPeerConnectionListeners(userId, pc);
      return pc;
    } catch (err) {
      console.error(`Error initializing peer connection for user ${userId}:`, err);
      throw err;
    }
  }

  // Get local media stream
  async initLocalStream(callType: CallType): Promise<MediaStream> {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      const isVideoCall = callType === CallType.Video;

      const constraints = isVideoCall
        ? {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        }
        : {
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream.getTracks().forEach((track) => {
        track.enabled = true;
      });
      return this.localStream;
    } catch (err) {
      console.error("Error getting local stream:", err);
      throw new Error("Không thể truy cập microphone/camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }

  // Create offer for a specific user
  async createOffer(userId: number): Promise<RTCSessionDescriptionInit> {
    try {
      const pc = await this.initPeerConnection(userId);

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true, // Always allow receiving video in group calls
      });

      await pc.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error(`Error creating offer for user ${userId}:`, err);
      throw err;
    }
  }

  // Create answer for a specific user
  async createAnswer(
    userId: number,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    try {
      const pc = await this.initPeerConnection(userId);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await this.processCandidateQueue(userId);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      return answer;
    } catch (err) {
      console.error(`Error creating answer for user ${userId}:`, err);
      throw err;
    }
  }

  // Handle answer from a specific user
  async handleAnswer(userId: number, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const pc = this.peerConnections.get(userId);
      if (!pc) {
        throw new Error(`Peer connection for user ${userId} not initialized`);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      await this.processCandidateQueue(userId);
    } catch (err) {
      console.error(`Error handling answer from user ${userId}:`, err);
      throw err;
    }
  }

  // Add ICE candidate for a specific user
  async addIceCandidate(userId: number, candidate: RTCIceCandidate): Promise<void> {
    try {
      const pc = this.peerConnections.get(userId);

      if (!pc || !pc.remoteDescription) {
        if (!this.candidateQueues.has(userId)) {
          this.candidateQueues.set(userId, []);
        }
        this.candidateQueues.get(userId)!.push(candidate);
        return;
      }

      await pc.addIceCandidate(candidate);
    } catch (err) {
      console.error(`Error adding ICE candidate for user ${userId}:`, err);
    }
  }

  // Process buffered candidates for a specific user
  private async processCandidateQueue(userId: number): Promise<void> {
    const pc = this.peerConnections.get(userId);
    const queue = this.candidateQueues.get(userId);
    if (!pc || !queue) return;

    while (queue.length > 0) {
      const candidate = queue.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error(`Error adding buffered ICE candidate for user ${userId}:`, err);
        }
      }
    }
    this.candidateQueues.delete(userId);
  }

  // Setup peer connection listeners
  private setupPeerConnectionListeners(userId: number, pc: RTCPeerConnection): void {
    pc.ontrack = (event: RTCTrackEvent) => {
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        this.remoteStreams.set(userId, remoteStream);
        this.onRemoteStreamReceived?.(userId, remoteStream);
      }
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        this.onIceCandidateFound?.(userId, event.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(userId, pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        this.closePeerConnection(userId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      this.onIceConnectionStateChange?.(userId, pc.iceConnectionState);
    };
  }

  // Close a specific peer connection
  closePeerConnection(userId: number): void {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    this.remoteStreams.delete(userId);
    this.candidateQueues.delete(userId);
    this.onRemoteStreamRemoved?.(userId);
  }

  // Close all connections and clean up
  closeAllConnections(): void {
    this.peerConnections.forEach((pc, userId) => {
      pc.close();
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.candidateQueues.clear();
    this.stopLocalStream();
  }

  // Stop local stream tracks
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  // Getters
  getLocalStream(): MediaStream | null { return this.localStream; }
  getRemoteStream(userId: number): MediaStream | null { return this.remoteStreams.get(userId) || null; }
  getAllRemoteStreams(): Map<number, MediaStream> { return this.remoteStreams; }
  getPeerConnection(userId: number): RTCPeerConnection | null { return this.peerConnections.get(userId) || null; }
}
