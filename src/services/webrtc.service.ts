import { CallType } from "../types";

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private config: RTCConfiguration = {
    iceServers: [
      { urls: ["stun:stun.l.google.com:19302"] },
      { urls: ["stun:stun1.l.google.com:19302"] },
      { urls: ["stun:stun2.l.google.com:19302"] },
      { urls: ["stun:stun3.l.google.com:19302"] },
      { urls: ["stun:stun4.l.google.com:19302"] },
    ],
  };

  private candidateQueue: RTCIceCandidate[] = [];

  // Callbacks
  onRemoteStreamReceived?: (stream: MediaStream) => void;
  onIceCandidateFound?: (candidate: RTCIceCandidate) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onSignalingStateChange?: (state: RTCSignalingState) => void;

  // Initialize peer connection
  async initPeerConnection(): Promise<void> {
    try {
      if (this.peerConnection) {
        console.warn("Peer connection already initialized");
        return;
      }

      this.peerConnection = new RTCPeerConnection(this.config);

      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream);
          }
        });
      }

      this.setupPeerConnectionListeners();
    } catch (err) {
      console.error("Error initializing peer connection:", err);
      throw err;
    }
  }

  // Get local media stream
  async initLocalStream(callType: CallType): Promise<MediaStream> {
    try {
      // If already have stream, return it
      if (this.localStream) {
        return this.localStream;
      }

      const isVideoCall = callType === CallType.Video;

      const constraints = isVideoCall
        ? {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        }
        : {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (err) {
      console.error("Error getting local stream:", err);
      throw new Error(
        "Không thể truy cập microphone/camera. Vui lòng kiểm tra quyền truy cập."
      );
    }
  }

  // Create offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      if (!this.peerConnection) {
        await this.initPeerConnection();
      }

      if (!this.peerConnection) {
        throw new Error("Failed to initialize peer connection");
      }

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.localStream?.getVideoTracks().length ? true : false,
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error("Error creating offer:", err);
      throw err;
    }
  }

  // Create answer
  async createAnswer(
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    try {
      if (!this.peerConnection) {
        await this.initPeerConnection();
      }

      if (!this.peerConnection) {
        throw new Error("Failed to initialize peer connection");
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      await this.processCandidateQueue();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      return answer;
    } catch (err) {
      console.error("Error creating answer:", err);
      throw err;
    }
  }

  // Handle answer
  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error("Peer connection not initialized");
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      await this.processCandidateQueue();
    } catch (err) {
      console.error("Error handling answer:", err);
      throw err;
    }
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (!this.peerConnection) return;

      if (!this.peerConnection.remoteDescription) {
        console.log("Buffered ICE candidate (no remote description)");
        this.candidateQueue.push(candidate);
        return;
      }

      await this.peerConnection.addIceCandidate(candidate);
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
      // Don't throw, as some candidates might fail
    }
  }

  // Process buffered candidates
  private async processCandidateQueue(): Promise<void> {
    if (!this.peerConnection) return;

    if (this.candidateQueue.length > 0) {
      console.log(`Processing ${this.candidateQueue.length} buffered ICE candidates`);

      while (this.candidateQueue.length > 0) {
        const candidate = this.candidateQueue.shift();
        if (candidate) {
          try {
            await this.peerConnection.addIceCandidate(candidate);
          } catch (err) {
            console.error("Error adding buffered ICE candidate:", err);
          }
        }
      }
    }
  }

  // Setup peer connection listeners
  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    // Track event - when remote stream is received
    this.peerConnection.ontrack = (event: RTCTrackEvent) => {
      console.log("Track received:", event.track.kind);

      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStreamReceived?.(this.remoteStream);
      }
    };

    // ICE candidate event
    this.peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("ICE candidate found:", event.candidate);
        this.onIceCandidateFound?.(event.candidate);
      } else {
        console.log("ICE candidate gathering complete");
      }
    };

    // Connection state change
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState || "failed";
      console.log("Connection state changed:", state);
      this.onConnectionStateChange?.(state);
    };

    // ICE connection state change
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState || "failed";
      console.log("ICE connection state changed:", state);
      this.onIceConnectionStateChange?.(state);
    };

    // Signaling state change
    this.peerConnection.onsignalingstatechange = () => {
      const state = this.peerConnection?.signalingState || "closed";
      console.log("Signaling state changed:", state);
      this.onSignalingStateChange?.(state);
    };

    // Handle connection errors
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log("Connection state changed:", state);

      if (state === "failed") {
        console.error("Peer connection failed.");
      }

      this.onConnectionStateChange?.(state || "failed");
    };
  }

  // Close connection and clean up
  closeConnection(): void {
    try {
      if (this.peerConnection) {
        // Close all senders
        this.peerConnection.getSenders().forEach((sender) => {
          sender.track?.stop();
        });

        this.peerConnection.close();
        this.peerConnection = null;
      }

      this.stopLocalStream();
      this.remoteStream = null;
    } catch (err) {
      console.error("Error closing connection:", err);
    }
  }

  // Stop local stream tracks
  stopLocalStream(): void {
    try {
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          track.stop();
        });
        this.localStream = null;
      }
    } catch (err) {
      console.error("Error stopping local stream:", err);
    }
  }

  // Getters
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // Helper to check if call is established
  isConnected(): boolean {
    return (
      this.peerConnection?.connectionState === "connected" &&
      this.remoteStream !== null
    );
  }
}