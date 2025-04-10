import axios, { AxiosResponse } from 'axios';
import { SubmissionResult, SubmissionResponse } from "@/types/Judge0API";
import { JUDGE0_API } from "@/common/config";

// Create submission to Judge0
export const createSubmission = async (
  sourceCode: string,
  languageId: number,
  stdin: string,
  expectedOutput?: string
): Promise<string> => {
  try {
    // Mã hóa dữ liệu thành base64 để tránh vấn đề với UTF-8
    const base64SourceCode = btoa(unescape(encodeURIComponent(sourceCode)));
    const base64Stdin = stdin ? btoa(unescape(encodeURIComponent(stdin))) : null;
    const base64ExpectedOutput = expectedOutput ? btoa(unescape(encodeURIComponent(expectedOutput))) : null;

    const payload = {
      source_code: base64SourceCode,
      language_id: languageId,
      stdin: base64Stdin,
      expected_output: base64ExpectedOutput
    };

    const response: AxiosResponse<SubmissionResponse> = await axios.post(
      `${JUDGE0_API.baseURL}/submissions?base64_encoded=true`,
      payload,
      {
        headers: JUDGE0_API.headers
      }
    );

    return response.data.token;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

// Get submission details
export const getSubmission = async (token: string): Promise<SubmissionResult> => {
  try {
    const response: AxiosResponse<SubmissionResult> = await axios.get(
      `${JUDGE0_API.baseURL}/submissions/${token}?base64_encoded=true`,
      {
        headers: JUDGE0_API.headers
      }
    );

    const data = response.data;

    // Giải mã kết quả từ base64
    if (data.stdout) {
      data.stdout = decodeURIComponent(escape(atob(data.stdout)));
    }
    if (data.stderr) {
      data.stderr = decodeURIComponent(escape(atob(data.stderr)));
    }
    if (data.compile_output) {
      data.compile_output = decodeURIComponent(escape(atob(data.compile_output)));
    }

    return data;
  } catch (error) {
    console.error('Error getting submission:', error);
    throw error;
  }
};

// Poll submission until it's done
export const pollSubmission = async (token: string): Promise<SubmissionResult> => {
  let submission: SubmissionResult;
  const maxTries = 10;
  let tries = 0;

  do {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      submission = await getSubmission(token);
      tries++;

      if (tries >= maxTries) {
        throw new Error('Timeout waiting for submission result');
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.error || error.message;
        throw new Error(`API Error (${statusCode}): ${errorMessage}`);
      }
      throw error;
    }
  } while (submission.status.id <= 2); // 1: In Queue, 2: Processing

  return submission;
};

// Prepare input data based on language
export const prepareStdin = (language: string, nums: string, target: string): string => {
  try {
    if (!nums || !target) {
      throw new Error('Invalid input data: nums or target is undefined');
    }

    if (language === 'cpp' || language === 'java') {
      return `${nums}\n${target}`;
    } else if (language === 'python') {
      return `${nums}\n${target}`;
    } else {
      // Mặc định cho các ngôn ngữ khác
      return `${nums}\n${target}`;
    }
  } catch (e) {
    console.error('Error parsing input:', e);
    throw new Error(`Error preparing input: ${e}`);
  }
};

export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;

      let errorMessage = `Error (${statusCode}): `;
      if (typeof errorData === 'object' && errorData !== null) {
        errorMessage += errorData.error || errorData.message || JSON.stringify(errorData);
      } else if (typeof errorData === 'string') {
        errorMessage += errorData;
      } else {
        errorMessage += error.message;
      }

      return errorMessage;
    } else if (error.request) {
      // Yêu cầu được gửi nhưng không nhận được phản hồi
      return 'Error: No response received from server';
    } else {
      // Lỗi khác khi thiết lập yêu cầu
      return `Error setting up request: ${error.message}`;
    }
  }
  // Lỗi không phải từ Axios
  return `Error: ${error.message || 'Unknown error'}`;
};
