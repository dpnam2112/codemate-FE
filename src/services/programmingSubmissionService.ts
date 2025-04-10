import ApiService from "@/common/api.service";
import { AuthConfig } from "@/services/authenServices";
import { IResponseData } from "@/modals/apis/response";
import { ChatMessage } from "@/types/chat";
import { ProgrammingSubmission, ProgrammingSubmissionStat } from "@/types/ProgrammingSubmission";

export const programmingSubmissionService = {
    async getSubmissionsOfACodeExercise(
        exerciseID: string
    ) {
        return await ApiService.query<IResponseData<ProgrammingSubmissionStat[]>>(
            `/programming-submissions?exercise_id=${exerciseID}`
        );
    },

    async getSubmissionDetails(
        submissionID: string
    ) {
        return await ApiService.get<IResponseData<ProgrammingSubmission>>(
            `/programming-submissions/${submissionID}`
        );
    },
};
