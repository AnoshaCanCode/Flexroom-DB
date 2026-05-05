import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export function getAuthHeader() {
    const token = sessionStorage.getItem('flexroom_token');
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
}

export const ASSESSMENTS_CREATE_ENDPOINT =
    process.env.REACT_APP_ASSESSMENTS_API_URL ||
    `${API_BASE}/api/grading/assessments`;

export function postCreateAssessment(formData) {
    return axios.post(ASSESSMENTS_CREATE_ENDPOINT, formData, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
        },
    });
}

export async function fetchStudentClasses() {
    const res = await fetch(`${API_BASE}/api/users/student/classes`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function fetchEvaluatorClasses() {
    const res = await fetch(`${API_BASE}/api/users/evaluator/classes`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function fetchClassAssessments(classId) {
    const res = await fetch(`${API_BASE}/api/grading/classes/${classId}/assessments`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function fetchAssessmentSubmissions(assessmentId) {
    const res = await fetch(`${API_BASE}/api/grading/assessments/${assessmentId}/submissions`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function downloadAssessmentQuestion(assessmentId) {
    const res = await fetch(`${API_BASE}/api/files/assessment/${assessmentId}/question`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        let msg = 'Could not download question paper';
        try {
            const j = await res.json();
            if (j.error) msg = j.error;
        } catch (_) {}
        throw new Error(msg);
    }
    return res.blob();
}

export async function downloadAssessmentKey(assessmentId) {
    const res = await fetch(`${API_BASE}/api/files/assessment/${assessmentId}/key`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        let msg = 'Could not download solution key';
        try {
            const j = await res.json();
            if (j.error) msg = j.error;
        } catch (_) {}
        throw new Error(msg);
    }
    return res.blob();
}

export async function fetchSubmissionFileBlob(submissionId) {
    const res = await fetch(`${API_BASE}/api/files/submission/${submissionId}`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.blob();
}

export async function fetchServerTime() {
    const res = await fetch(`${API_BASE}/api/time`);
    if (!res.ok) throw new Error('Could not load server time');
    return res.json();
}

/** Student assignment dashboard: assessment + own submission + grade */
export async function fetchStudentAssignmentDashboard(assessmentId) {
    const res = await fetch(`${API_BASE}/api/grading/student/assessments/${assessmentId}/dashboard`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Could not load assignment');
    }
    return res.json();
}

export async function deleteStudentSubmission(submissionId) {
    const res = await fetch(`${API_BASE}/api/grading/student/submissions/${submissionId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not unsubmit');
    }
    return res.json();
}

export async function getEvaluatorMarkingContext(submissionId) {
    const res = await fetch(`${API_BASE}/api/grading/evaluator/submissions/${submissionId}/marking-context`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function postPlagiarismRun(submissionId) {
    const res = await fetch(`${API_BASE}/api/grading/plagiarism/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ submissionId: Number(submissionId) }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Plagiarism run failed');
    }
    return res.json();
}

export async function postAutograde(submissionId) {
    const res = await fetch(`${API_BASE}/api/grading/autograde`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ submissionId: Number(submissionId) }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Autograde failed');
    }
    return res.json();
}

export async function finalizeEvaluatorGrade(payload) {
    const res = await fetch(`${API_BASE}/api/grading/evaluator/finalize-grade`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not finalize grades');
    }
    return res.json();
}

export async function getStudentSelfEvalContext(assessmentId) {
    const res = await fetch(`${API_BASE}/api/grading/student/assessments/${assessmentId}/self-eval-context`, {
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export async function saveStudentSelfEval(assessmentId, body) {
    const res = await fetch(`${API_BASE}/api/grading/student/assessments/${assessmentId}/self-eval`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not save self evaluation');
    }
    return res.json();
}

export async function joinClassByCode(classCode) {
    const res = await fetch(`${API_BASE}/api/users/join-class`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        },
        body: JSON.stringify({ classCode: Number(classCode) }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not join class');
    }
    return res.json();
}
