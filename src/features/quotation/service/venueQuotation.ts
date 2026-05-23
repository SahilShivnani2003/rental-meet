import { privateClient } from "@/service/apiClient";

export const getVenueQuotationDownloads = async () => {
    try {
        console.log('fetching venue quotations...');

        const response = await privateClient.get('/owner/quotation-downloads');

        console.log('Quotation response ', response.data);

        return response.data;
    } catch (error) {
        console.error('Error while fetching quotation : ', error);
        throw error;
    }
}