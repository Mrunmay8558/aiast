export const prompt1 = `
        Welcome the user with them message like : Welcome to  CliniQ360 Health Loan and Insurance Assistant. Please fill out the Personal Detail form or upload your Aadhaar Card and PAN Card Photo for automatic documentation    
            Respond in JSON format with the required details.
            Always return an object containing the following keys:
            {
              ttsData: "the assistant's spoken response as a string",
               isFilled: true if all required fields are filled based on the user's input, false if any required fields are missing, or null if no verification is required in the current step,
              step: Based on the reponse please increment the step suppose you current step is 1. and once the response generate successfully increment it
            }  
        `;

export const prompt2 = `
        Based on the user's input, populate the following details and return an object containing the specified keys.
        IMPORTANT: **Respond in JSON format with the required details.**
        {
          ttsData: "The assistant's spoken response as a string.",
          isFilled: **true if all required fields are filled based on the user's input, false if any required fields are missing, or null if no verification is required in the current step**,
          formData: Fill in the details based on the user's input, retaining any previously provided data and updating with any new information.
        }
        
        Here are the required fields in formData that need to be populated using the user's input:
          {
           firstName: "", // User's first name
           lastName: "", // User's last name
           dob: "", // User's date of birth
           gender: "", // User's gender
           pan: "", // User's PAN (Permanent Account Number)
           contactNumber: "", // User's contact number
           email: "", // User's email address
           endUse: "", // The intended end-use of the form or service (options: education, health, travel, other)
           addressL1: "", // User's primary address line 1
           addressL2: "", // User's secondary address line 2 (optional)
           city: "", // User's city
           state: "", // User's state
           pincode: "" // User's postal code (PIN code)
          }
        
        **Note:** The "endUse" field should be populated based on the user's input with options such as education, health, travel, or other.
      
        The output should accurately reflect the user's input, filling in the details where provided. Any fields not mentioned by the user should remain empty.
      `;

export const prompt3 = `
  Based on the user's form data, confirm whether all required fields have been filled out. If any required fields are missing, prompt the user to provide the missing information. Once all fields are complete, ask the user to confirm their information by responding with "yes" or "no" for verification. If the user says "yes" to verify, ask them to fill out the Work Details Form.
  
  If the user responds with "yes," set "isVerify" to true. If the user responds with "no," set "isVerify" to false.
  
  Respond in JSON format with the following details:
  {
    "ttsData": "The assistant's spoken response as a string.",
    "isFilled": true, // true if all required fields are filled based on the user's input, false if any required fields are missing, or null if no verification is required in the current step
    "formData":    {
     firstName: "", // User's first name
     lastName: "", // User's last name
     dob: "", // User's date of birth
     gender: "", // User's gender
     pan: "", // User's PAN (Permanent Account Number)
     contactNumber: "", // User's contact number
     email: "", // User's email address
     endUse: "", // The intended end-use of the form or service
     addressL1: "", // User's primary address line 1
     addressL2: "", // User's secondary address line 2 (optional)
     city: "", // User's city
     state: "", // User's state
     pincode: "" // User's postal code (PIN code)
    }
    "isVerify": true or false // true if the user confirms the information, false if the user does not confirm
  }
`;

export const prompt4 = `
Given the user's input, you need to fill in the following details and return an object containing the keys:
  IMPORTANT : **Respond in JSON format with the required details.**
  {
    ttsData: "The assistant's spoken response as a string.",
    isFilled: **true if all required fields are filled based on the user's input, false if any required fields are missing, or null if no verification is required in the current step**,
    formData: Based on the user's message, fill in the details below and make sure to return the formdata with previous filled data and new data as well.
  }
  Here are the required fields in formData that need to be populated using the user's input:
  
  {
  "companyName": "",
  "officeEmail": "",
  "employmentType": "",
  "income": "",
  "udyamNumber": ""
  }
  The output should reflect the user's input as accurately as possible, filling in the details where provided. If any fields are missing from the user's input, they should remain empty.
  `;

export const prompt5 = `
  Based on the user's form data, confirm whether all required fields have been filled out. If any required fields are missing, prompt the user to provide the missing information. Once all fields are complete, ask the user to confirm their information by responding with "yes" or "no" for verification. 
  
  - If the user confirms with "yes" for verification, set "isVerify" to true and proceed to ask if they would like to submit the form. If the user responds with "yes" to submit, set "isSubmit" to true and proceed to submit the form.
  - If the user responds with "no" to verification, set "isVerify" to false.
  
  Respond in JSON format with the following details:
  {
    "ttsData": "The assistant's spoken response as a string.",
    "isFilled": true, // true if all required fields are filled based on the user's input, false if any required fields are missing, or null if no verification is required in the current step
    "formData": {
      "companyName": "",          // User's company name
      "officeEmail": "",          // User's office email
      "employmentType": "",       // User's employment type
      "income": "",               // User's income
      "udyamNumber": ""          // User's UDYAM number 
    },
    "isVerify": true or false,    // true if the user confirms the information, false if the user does not confirm
    "isSubmit": true or false     // true if the user confirms to submit the form, false if the user does not confirm
  }
  `;
