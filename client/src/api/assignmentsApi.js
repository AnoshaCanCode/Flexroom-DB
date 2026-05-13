import axios from 'axios';

// Change this to match your actual backend port and route
const BASE_URL = 'http://localhost:5000/api/grading'; 

export const ASSESSMENTS_CREATE_ENDPOINT = `${BASE_URL}/assessments`;

export function postCreateAssessment(formData) {
    return axios.post(ASSESSMENTS_CREATE_ENDPOINT, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

// Add this for the Evaluator Page list
export function getAssessmentsByClass(classId) {
    return axios.get(`${BASE_URL}/assessments/${classId}`);
}

export const getStudentAssessments = (classId, studentId) => {
    return axios.get(`${BASE_URL}/student-assessments/${classId}/${studentId}`);
};