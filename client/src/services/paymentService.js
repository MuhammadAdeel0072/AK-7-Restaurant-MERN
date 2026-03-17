import apiClient from './apiClient';

export const getPaymentConfig = async () => {
  const response = await apiClient.get('/payments/config');
  return response.data;
};
