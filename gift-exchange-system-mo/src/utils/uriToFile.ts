export const uriToFile = async (uri: string, filename: string): Promise<File> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};
