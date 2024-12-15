
DOCUMENT_KEYWORDS = {
    "fire_safety_certificate": [
        "document_name", "issuing_authority", "issuance_date", 
        "expiry_date", "fire_equipment_details"
    ],
    "land_conversion_certificate": [
        "issuing_authority", "issue_date", "applicant_name", "contact_information", 
        "location", "area_of_land"
    ],
    "affidavit": [
        "document_name","stamp_paper_type", "notary_registration_number", 
        "oath_commissioner_name", "verification_place", 
        "verification_date", "executant_name", "executant_designation"
    ],
    "bank_certificate": [
        "document_name","account_holder_name", "account_number", "bank_name", 
        "bank_address", "fdr_details", "balance_verification", 
        "certificate_date", "certificate_place"
    ],
    "architect_certificate": [
        "document_name","approval_authority", "approval_number", "approval_date", 
        "room_details", "occupancy_certificate", "structural_stability_certificate"
    ],
    "mou_document": [
        "indian_institute_name", "foreign_institute_name", 
        "document_reference_number", "date_of_issue", 
        "event_date", "event_time", "venue", "purpose", 
        "key_participants"
    ],
    "occupancy_certificate": [
       "document_name", "memo_number", "date_of_issue", "holding_number", 
        "street", "ward_number", "building_type"
    ]
}

validation_guidelines = {
                "fire_safety_certificate": {
                "required_fields": [
                "document_type",
                "certificate_number",
                "issuing_authority",
                "issuance_date",
                "expiry_date",
                "fire_equipment_details"
                ],
                "validation_criteria": """
                Validation Criteria for Fire Safety Certificate:
                - Certificate Number must be unique and from a recognized authority
                - Validate issuance and expiry dates
                - Confirm comprehensive fire equipment details
                """
                },
                "land_conversion_certificate": {
                "required_fields": [
                "document_type",
                "certificate_number",
                "issuing_authority",
                "issue_date",
                "applicant_name",
                "location",
                "area_of_land"
                ],
                "validation_criteria": """
                Validation Criteria for Land Conversion Certificate:
                - Ensure document type is exactly 'Land Conversion Certificate'
                - Validate certificate number and issuing authority
                - Confirm applicant details and land location
                - Check area of land specifications
                """
                },
                "affidavit": {
                "required_fields": [
                "document_type",
                "stamp_paper_type",
                "notary_registration_number",
                "oath_commissioner_name",
                "verification_place",
                "verification_date",
                "executant_name",
                "executant_designation"
                ],
                "validation_criteria": """
                Validation Criteria for Affidavit:
                - Ensure document type is exactly 'Affidavit'
                - Validate stamp paper details
                - Confirm notary registration number
                - Check verification details and executant information
                """
                },
                "bank_certificate": {
                "required_fields": [
                "document_type",
                "account_holder_name",
                "account_number",
                "bank_name",
                "bank_address",
                "fdr_details",
                "balance_verification",
                "certificate_date",
                "certificate_place"
                ],
                "validation_criteria": """
                Validation Criteria for Bank Certificate:
                - Ensure document type is exactly 'Bank Certificate'
                - Validate account holder and account details
                - Confirm bank information
                - Check FDR and balance verification details
                """
                }
            }
