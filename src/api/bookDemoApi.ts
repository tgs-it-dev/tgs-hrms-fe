import axiosInstance from './axiosInstance';

export interface BookDemoPayload {
  fullName: string;
  workEmail: string;
  companyName: string;
  teamSize: string;
}

export interface BookDemoResponse {
  message: string;
  success: boolean;
}

export async function submitBookDemo(
  payload: BookDemoPayload
): Promise<BookDemoResponse> {
  const response = await axiosInstance.post<BookDemoResponse>(
    '/leads/book-demo',
    payload
  );
  return response.data;
}
