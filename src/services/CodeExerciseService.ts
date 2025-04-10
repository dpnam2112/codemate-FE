import ApiService from "@/common/api.service";
import { AuthConfig } from "./authenServices";
import { LanguageConfigDto, SubmissionDto } from "@/types/CodingExercise";
import { IResponseData } from "@/modals/apis/response";

export const CodeExerciseService = {
  async getCodingSubmissionsOfAnExercise(exerciseId: string, { showError, showSuccess }: AuthConfig) {
    return ApiService.get<IResponseData<SubmissionDto[]>>(`/exercises/${exerciseId}/coding-submissions`, "", { showError, showSuccess })
  },

  async getLanguageConfigsOfAnExercise(exerciseId: string, { showError, showSuccess }: AuthConfig) {
    return ApiService.get<IResponseData<LanguageConfigDto[]>>(`/exercises/${exerciseId}/language-configs`, "", { showError, showSuccess })
  }
}
