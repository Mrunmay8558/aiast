import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const BaseURL = "http://localhost:8000/";

const TTS = ({
  transcriptionText,
  addURL,
  formdata,
  setFormData,
  submit,
  setSubmit,
  step,
  setStep,
}) => {
  const [isVerify, setIsVerify] = useState(null);
  const [isConsent, setIsConsent] = useState(null);
  const [isSubmit, setIsSubmit] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (submit) {
      handleSendText(transcriptionText);
      setSubmit(false);
    }
  }, [submit]);

  function checkStep() {
    if (formdata && step === 2) {
      return !formdata.firstName ||
        !formdata.lastName ||
        !formdata.dob ||
        !formdata.contactNumber ||
        !formdata.pan ||
        !formdata.pincode ||
        !formdata.city ||
        !formdata.state ||
        !formdata.gender ||
        !formdata.addressL1 ||
        !formdata.addressL2 ||
        !formdata.email ||
        !formdata.endUse
        ? 2
        : formdata.firstName ||
          formdata.lastName ||
          formdata.dob ||
          formdata.contactNumber ||
          formdata.pan ||
          formdata.pincode ||
          formdata.city ||
          formdata.state ||
          formdata.gender ||
          formdata.addressL1 ||
          formdata.addressL2 ||
          formdata.email ||
          formdata.endUse
        ? 3
        : step;
    } else if (step === 4 && (isVerify === false || isVerify === null)) {
      return 3;
    } else if (formdata && step === 4) {
      return (
        //proffesional details
        !formdata.companyName ||
          !formdata.officialEmail ||
          !formdata.employmentType ||
          !formdata.income ||
          !formdata.udyamNumber
          ? 4
          : step
      );
    }
    // else if (step === 5 && (isVerify === false || isVerify === null)) {
    //   return 4;}
    else if (step === 6 && (isVerify === false || isVerify === null)) {
      return 5;
    } else if (step === 6 && isSubmit === false) {
      return;
    } else {
      return step;
    }
  }

  const handleSendText = async (text) => {
    try {
      console.log("Step:", checkStep());

      const response = await axios.post(
        `${BaseURL}v1/get-audio-file`,
        {
          transcribedText: {
            message: text,
            formdata: formdata,
            isConsent: isConsent,
          },
          step: checkStep(),
        },
        { responseType: "text" }
      );

      const res = JSON.parse(response?.data);
      console.log(res);
      setIsSubmit(res?.isSubmit);
      setIsVerify(res?.isVerify);
      setIsConsent(res?.isConsent);
      if (res?.formdata) {
        setFormData((prevFormData) => ({
          ...prevFormData,
          ...res.formdata,
        }));
      }

      if (res?.isFilled === true || (step === 1 && res?.isFilled === null)) {
        setStep(res?.step + 1);
      }
      const audioBlob = base64ToBlob(res?.data, "audio/wav");
      const audioUrl = URL.createObjectURL(audioBlob);
      addURL(audioUrl, res?.ttsData);

      // Set the audio URL as the source of the audio element
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const base64ToBlob = (base64Data, contentType) => {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  };

  return;
};

export default TTS;
