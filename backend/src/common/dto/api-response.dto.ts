export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  errors?: any;
}

export class ResponseDto {
  static success<T>(message: string, data?: T, meta?: any): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta,
    };
  }

  static error(message: string, errors?: any): ApiResponse<null> {
    return {
      success: false,
      message,
      errors,
    };
  }
}
