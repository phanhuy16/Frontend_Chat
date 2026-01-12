import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

export interface LinkPreviewData {
    title: string;
    description: string;
    imageUrl: string;
    url: string;
    siteName: string;
}

const metadataApi = {
    getLinkPreview: async (url: string): Promise<LinkPreviewData> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/metadata/preview`, {
            params: { url },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    }
};

export default metadataApi;
