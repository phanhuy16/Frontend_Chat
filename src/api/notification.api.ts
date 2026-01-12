import axiosInstance from './axios';

export interface SubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const notificationApi = {
  getPublicKey: (): Promise<{ publicKey: string }> =>
    axiosInstance.get('/notification/public-key').then((res) => res.data),

  subscribe: (subscription: SubscriptionDto): Promise<void> =>
    axiosInstance.post('/notification/subscribe', subscription),

  unsubscribe: (endpoint: string): Promise<void> =>
    axiosInstance.post('/notification/unsubscribe', { endpoint }),
};
