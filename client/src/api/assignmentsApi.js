import axios from 'axios';

export const ASSESSMENTS_CREATE_ENDPOINT =
    process.env.REACT_APP_ASSESSMENTS_API_URL ||
    '/api/assessments-backend/api/grading/assessments';

export function postCreateAssessment(formData) {
    return axios.post(ASSESSMENTS_CREATE_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}
