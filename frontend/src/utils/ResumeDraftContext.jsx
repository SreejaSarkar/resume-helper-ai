import React, { createContext, useContext, useMemo, useState } from "react";

const ResumeDraftContext = createContext(null);

const defaultUploadText = "Upload your resume (.pdf)";

export const ResumeDraftProvider = ({ children }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [uploadFileText, setUploadFileText] = useState(defaultUploadText);

  const clearResumeDraft = () => {
    setResumeFile(null);
    setJobDesc("");
    setUploadFileText(defaultUploadText);
  };

  const value = useMemo(
    () => ({
      resumeFile,
      setResumeFile,
      jobDesc,
      setJobDesc,
      uploadFileText,
      setUploadFileText,
      defaultUploadText,
      clearResumeDraft,
    }),
    [resumeFile, jobDesc, uploadFileText],
  );

  return (
    <ResumeDraftContext.Provider value={value}>
      {children}
    </ResumeDraftContext.Provider>
  );
};

export const useResumeDraft = () => {
  const context = useContext(ResumeDraftContext);

  if (!context) {
    throw new Error("useResumeDraft must be used within a ResumeDraftProvider");
  }

  return context;
};
