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
  const audioRef = useRef(null);

  useEffect(() => {
    if (submit) {
      handleSendText(transcriptionText);
      setSubmit(false);
    }
  }, [submit]);

  function checkStep() {
    if (formdata && step === 2) {
      return (
        (!formdata.name ||
          !formdata.age ||
          !formdata.dob ||
          !formdata.mobile_number ||
          !formdata.aadhaar_number ||
          !formdata.address.street ||
          !formdata.address.locality ||
          !formdata.address.city ||
          !formdata.address.state ||
          !formdata.address.country ||
          !formdata.pincode) &&
        2
      );
    } else if (step === 3 && isVerify === false) {
      return 2;
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
          transcribedText: { message: text, formdata: formdata },
          step: checkStep(),
        },
        { responseType: "text" }
      );

      const res = JSON.parse(response?.data);
      console.log(res);
      setIsVerify(res?.isVerify);
      if (res?.formdata) setFormData(res?.formdata);

      if (res?.isFilled === true || res?.isFilled === null) {
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
