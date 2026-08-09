export const getErrorMessage = (error) => {
  const dataError = error.response?.data?.error;
  if (dataError) {
    if (typeof dataError === "string") return dataError;
    if (typeof dataError === "object") {
      return dataError.message || dataError.code || JSON.stringify(dataError);
    }
  }
  return error.message || "Đã xảy ra lỗi không xác định.";
};
