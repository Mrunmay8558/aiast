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
           gender: "", // User's gender Based on the Gender Give just M or F
           pan: "", // User's PAN (Permanent Account Number)
           contactNumber: "", // User's contact number
           email: "", // User's email address
           endUse: "", // The intended end-use of the form or service (options: education, health, travel, other)
           addressL1: "", // User's primary address line 1
           addressL2: "", // User's secondary address line 2 
           city: "", // User's city
           state: "", // User's state
           pincode: "" // User's postal code (PIN code)
          }
        
        **Note:** The "endUse" field should be populated based on the user's input and whatever input that fits into these options such as education, health, travel, or other should be assign for ex: I want to travel a world so endUse should be travel.
      
        The output should accurately reflect the user's input, filling in the details where provided. Any fields not mentioned by the user should remain empty.
      `;

export const prompt3 = `
      Based on the user's form data, confirm whether all required fields have been filled out. If any required fields are missing, prompt the user to provide the missing information.
      
      - **Once all fields are complete:**
        1. Ask the user to confirm their information by responding with "yes" or "no" for verification.
        2. If the user responds with "yes" to verification:
           - Set "isVerify" to true and proceed to ask them to fill out the Work Details Form.
        3. If the user responds with "no" to verification:
           - Set "isVerify" to false and prompt the user to verify their information again.
      
      - **If the user has already verified the data:** Skip the verification step and proceed to the next required step.
      
      Respond in JSON format with the following details:
      
      {
        "ttsData": "The assistant's spoken response as a string.",
        "isFilled": true or false, // true if all required fields are filled based on the user's input, false if any required fields are missing
        "formData": {
          "firstName": "",       // User's first name
          "lastName": "",        // User's last name
          "dob": "",             // User's date of birth
          "gender": "",          // User's gender
          "pan": "",             // User's PAN (Permanent Account Number)
          "contactNumber": "",   // User's contact number
          "email": "",           // User's email address
          "endUse": "",          // The intended end-use of the form or service
          "addressL1": "",       // User's primary address line 1
          "addressL2": "",       // User's secondary address line 2
          "city": "",            // User's city
          "state": "",           // User's state
          "pincode": ""          // User's postal code (PIN code)
        },
        "isVerify": true or false // true if the user confirms the information is correct, false if the user does not confirm
      }
      `;
export const prompt4 = `
      **Objective:**
      Based on the user's input, update the form data while preserving any existing details. The response should reflect the user's latest input without erasing previously provided information.
      
      **Instructions:**
      1. **Data Population:**
         - Populate the following fields in the JSON response based on the user's input:
           - "companyName"
           - "officialEmail"
           - "employmentType"
           - "income"
           - "udyamNumber"
         
         - If the user provides new information for any of these fields, update the corresponding field.
         - If the user does not provide new information for a field, retain the existing value in that field.
      
      2. **Verification:**
         - Set the "isFilled" flag:
           - **true**: All required fields are filled based on the user's input.
           - **false**: One or more required fields are missing.
           - **null**: No verification is needed in the current step.
      
      3. **Missing Information:**
         - If any required fields are missing from the user's input, do not overwrite them; instead, keep the previous value or prompt the user to provide the missing information.
      
      **JSON Response Format:**
      {
        "ttsData": "The assistant's spoken response as a string.",
        "isFilled": true, false, or null,  // true if all required fields are filled, false if any required fields are missing, or null if no verification is required
        "formData": {
          "companyName": "",       // Populate with the user's input or retain the previous value if not updated
          "officialEmail": "",     // Populate with the user's input or retain the previous value if not updated
          "employmentType": "",    // Populate with the user's input or retain the previous value if not updated
          "income": "",            // Populate with the user's input or retain the previous value if not updated
          "udyamNumber": ""        // Populate with the user's input or retain the previous value if not updated
        }
      }
      
      **Important:**
      - The response should accurately reflect the user's input while maintaining the integrity of previously provided data.
      - Do not erase or overwrite any details unless new input is provided by the user.
      `;

export const prompt5 = `
  **Objective:**
  Based on the user's form data, ensure that all required fields are filled out. If any required fields are missing, prompt the user to provide the missing information and proceed to verification.
  
  **Step 1: Field Verification**
  - Validate that the following required fields in the user's form data are completed:
    - "companyName": The name of the user's company.
    - "officialEmail": The user's official email address.
    - "employmentType": The user's employment type (e.g., full-time, part-time, freelance).
    - "income": The user's reported income.
    - "udyamNumber": The UDYAM registration number for the company.
  
  - If any of these fields are missing or left empty:
    - Prompt the user to provide the missing information.
    - Set the "isFilled" flag to **false**.
  
  - If all required fields are filled:
    - Set the "isFilled" flag to **true**.
  
  **Step 2: Verification**
  - Once all required fields are completed:
    - Ask the user to confirm the accuracy of the information by responding with "yes" or "no":
      - If the user responds with "yes":
        - Set "isVerify" to **true**. and ask the user for their consent to the terms and conditions.
      - If the user responds with "no":
        - Set "isVerify" to **false**.
        - Prompt the user to review and correct the information.
  
  **JSON Response Format:**
  {
    "ttsData": "The assistant's spoken response as a string, either asking for missing information, confirming details, or seeking consent.",
    "isFilled": true or false, // true if all required fields are filled, false if any required fields are missing
    "formData": {
      "companyName": "",          // User's company name
      "officialEmail": "",        // User's official email
      "employmentType": "",       // User's employment type
      "income": "",               // User's reported income
      "udyamNumber": ""           // User's UDYAM number
    },
    "isVerify": true or false    // true if the user confirms the information is correct, false if the user does not confirm
  }
  `;

export const prompt6 = `
IF user formData is already have isConsent = true then Direct ask Step 2: Submission Confirmation
**Step 1: Consent**
- Request the user to give consent to the terms and conditions for processing their data:
  - If the user agrees, set "isConsent" to **true**.
  - If the user does not agree, set "isConsent" to **false** and inform them that the form cannot be submitted without consent.

**Important Note:**
- If the user has previously provided consent, do not reset the "isConsent" value. Keep it as **true** if it was previously set.

**Step 2: Submission Confirmation**
- After obtaining consent and when isConsent is true, ask the user if they would like to submit the form by responding with "yes" or "no":
  - If the user responds with "yes" set "i
  sSubmit" to **true** and proceed to submit the form data.
  - If the user responds with "no" set "isSubmit" to **false** and inform the user that the form will not be submitted.

Respond in JSON format with:
{
  "ttsData": "The assistant's spoken response as a string, asking the user to confirm their consent and whether they want to submit the form.",
  "isConsent": true or false,    // true if the user gives consent to the terms and conditions, false if not
  "isSubmit": true or false     // true if the user confirms submission of the form by saying "YES", false if "NO
}
`;
