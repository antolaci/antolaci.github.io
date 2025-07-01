// Updated translations with all fields and languages
const translations = {
  en: {
    title: "Guest Check-In",
    formTitle: "Guest Check-In",
    personalInfo: "Personal Information",
    addressInfo: "Address Information",
    fullName: "Full Name",
    surname: "Surname",
    secondSurname: "Second Surname",
    documentId: "ID / Passport Number",
    documentType: "Document Type",
    email: "Email",
    phone: "Phone Number",
    dob: "Date of Birth",
    nationality: "Nationality",
    gender: "Gender",
    address: "Address",
    city: "City",
    province: "Province",
    postalCode: "Postal Code",
    country: "Country",
    signature: "Signature",
    clear: "Clear Signature",
    submit: "Submit",
    legalText: "This information is collected to comply with Spanish law, specifically Real Decreto 933/2021, which mandates the recording and communication of certain data for security purposes."
  },
  es: {
    title: "Registro de Huéspedes",
    formTitle: "Registro de Huéspedes",
    personalInfo: "Información Personal",
    addressInfo: "Información de Dirección",
    fullName: "Nombre completo",
    surname: "Apellido",
    secondSurname: "Segundo apellido",
    documentId: "DNI / Pasaporte",
    documentType: "Tipo de documento",
    email: "Correo electrónico",
    phone: "Teléfono",
    dob: "Fecha de nacimiento",
    nationality: "Nacionalidad",
    gender: "Género",
    address: "Dirección",
    city: "Ciudad",
    province: "Provincia",
    postalCode: "Código postal",
    country: "País",
    signature: "Firma",
    clear: "Borrar firma",
    submit: "Enviar",
    legalText: "Esta información se recopila para cumplir con la ley española, específicamente el Real Decreto 933/2021, que exige el registro y comunicación de ciertos datos con fines de seguridad."
  },
  fr: {
    title: "Enregistrement des Invités",
    formTitle: "Enregistrement des Invités",
    personalInfo: "Informations Personnelles",
    addressInfo: "Informations d'Adresse",
    fullName: "Nom complet",
    surname: "Nom de famille",
    secondSurname: "Deuxième nom de famille",
    documentId: "Carte d'identité / Passeport",
    documentType: "Type de document",
    email: "Email",
    phone: "Numéro de téléphone",
    dob: "Date de naissance",
    nationality: "Nationalité",
    gender: "Genre",
    address: "Adresse",
    city: "Ville",
    province: "Province",
    postalCode: "Code postal",
    country: "Pays",
    signature: "Signature",
    clear: "Effacer la signature",
    submit: "Soumettre",
    legalText: "Ces informations sont collectées pour se conformer à la loi espagnole, en particulier le Real Decreto 933/2021, qui exige l'enregistrement et la communication de certaines données à des fins de sécurité."
  },
  de: {
    title: "Gast-Check-in",
    formTitle: "Gast-Check-in",
    personalInfo: "Persönliche Informationen",
    addressInfo: "Adressinformationen",
    fullName: "Vollständiger Name",
    surname: "Nachname",
    secondSurname: "Zweiter Nachname",
    documentId: "Ausweis-/Reisepassnummer",
    documentType: "Dokumententyp",
    email: "E-Mail",
    phone: "Telefonnummer",
    dob: "Geburtsdatum",
    nationality: "Staatsangehörigkeit",
    gender: "Geschlecht",
    address: "Adresse",
    city: "Stadt",
    province: "Provinz",
    postalCode: "Postleitzahl",
    country: "Land",
    signature: "Unterschrift",
    clear: "Unterschrift löschen",
    submit: "Einreichen",
    legalText: "Diese Informationen werden gemäß dem spanischen Gesetz, insbesondere dem Real Decreto 933/2021, erhoben, das die Aufzeichnung und Übermittlung bestimmter Daten zu Sicherheitszwecken vorschreibt."
  }
};

function applyTranslations(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = translations[lang][key];
  });
}

document.getElementById("lang-switcher").addEventListener("change", e => {
  applyTranslations(e.target.value);
});
applyTranslations("en");

// Signature pad functionality
const form = document.getElementById('checkin-form');
const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => {
  drawing = false;
  ctx.beginPath();
});
canvas.addEventListener('mousemove', draw);

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

function clearSignature() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Field to label mapping for PDF
const fieldLabels = {
  name: "Full Name",
  surname1: "Surname",
  surname2: "Second Surname",
  document: "ID/Passport Number",
  documentType: "Document Type",
  email: "Email",
  phone: "Phone Number",
  dob: "Date of Birth",
  nationality: "Nationality",
  gender: "Gender",
  address: "Address",
  city: "City",
  province: "Province",
  postalCode: "Postal Code",
  country: "Country"
};

// Updated form submit handler with improved PDF generation
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Show spinner and disable button
  const submitBtn = document.getElementById('submit-btn');
  const spinner = document.getElementById('spinner');
  submitBtn.disabled = true;
  spinner.classList.remove('hidden');
  
  try {
    const formData = new FormData(form);
    const signatureDataUrl = canvas.toDataURL();
    const lang = document.getElementById('lang-switcher').value;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add form title
    doc.setFontSize(16);
    doc.text(translations[lang].formTitle, 105, 15, null, null, 'center');
    doc.setFontSize(12);
    
    // Personal Information section
    doc.text(translations[lang].personalInfo + ":", 14, 25);
    let y = 35;
    
    // Create a mapping of field names to human-readable labels
    const labelMap = {
      name: translations[lang].fullName,
      surname1: translations[lang].surname,
      surname2: translations[lang].secondSurname,
      document: translations[lang].documentId,
      documentType: translations[lang].documentType,
      email: translations[lang].email,
      phone: translations[lang].phone,
      dob: translations[lang].dob,
      nationality: translations[lang].nationality,
      gender: translations[lang].gender
    };
    
    // Add personal info fields
    for (const [key, label] of Object.entries(labelMap)) {
      const value = formData.get(key) || 'N/A';
      doc.text(`${label}: ${value}`, 20, y);
      y += 8;
    }
    
    // Address Information section
    y += 5;
    doc.text(translations[lang].addressInfo + ":", 14, y);
    y += 10;
    
    const addressLabelMap = {
      address: translations[lang].address,
      city: translations[lang].city,
      province: translations[lang].province,
      postalCode: translations[lang].postalCode,
      country: translations[lang].country
    };
    
    // Add address fields
    for (const [key, label] of Object.entries(addressLabelMap)) {
      const value = formData.get(key) || 'N/A';
      doc.text(`${label}: ${value}`, 20, y);
      y += 8;
    }
    
    // Signature section
    y += 10;
    doc.text(translations[lang].signature + ":", 14, y);
    y += 8;
    doc.addImage(signatureDataUrl, 'PNG', 20, y, 80, 40);
    y += 45;
    
    // Legal disclaimer
    doc.setFontSize(10);
    doc.text(translations[lang].legalText, 14, y, { maxWidth: 180 });
    
    // Generate filename
    const guestName = formData.get('name');
    const guestDOB = formData.get('dob');
    const filename = `CheckIn_${guestName.replace(/\s+/g, '_')}_${guestDOB}.pdf`;
    
    // Convert to blob
    const pdfBlob = doc.output('blob');
    
    // Convert blob to base64
    const base64Pdf = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(pdfBlob);
    });

    // Upload to Google Drive
    const uploadResponse = await fetch("https://script.google.com/macros/s/AKfycbwmnSIcC_Lx5LBbh-Z8VPdsLnhe-a6c2HXr9eNBDFNScEs5EyRQyLx4svxjPn61UKj7YA/exec", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        filename: filename,
        mimeType: "application/pdf",
        data: base64Pdf
      })
    });

    const responseText = await uploadResponse.text();
    
    if (responseText.includes("Success")) {
      alert("Form submitted successfully!");
      form.reset();
      clearSignature();
    } else {
      alert("Error: " + responseText);
    }
  } catch (error) {
    alert("An error occurred: " + error.message);
  } finally {
    // Hide spinner and re-enable button
    spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
});