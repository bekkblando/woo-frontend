import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconX, IconSparkles, IconPaperclip, IconTrash, IconLoader2, IconChevronDown } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { getCSRFHeaders } from '../hooks/authentication_helper';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

interface UploadedDocument {
  s3_key: string;
  filename: string;
  content_type: string;
  size?: number;
}

interface WooSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  submissionType: 'informatieverzoek' | 'woo_verzoek';
}

const WooSubmitModal: React.FC<WooSubmitModalProps> = ({
  isOpen,
  onClose,
  accessToken,
  submissionType,
}) => {
  const navigate = useNavigate();

  // Personal details
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Request details (AI-prefillable)
  const [subject, setSubject] = useState('');
  const [requestText, setRequestText] = useState('');
  const [period, setPeriod] = useState('');

  // Track which fields were AI-prefilled
  const [aiPrefilled, setAiPrefilled] = useState<Record<string, boolean>>({});

  // Appendixes
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Additional
  const [comments, setComments] = useState('');
  const [consent, setConsent] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);


  // State
  const [isLoading, setIsLoading] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setOrganization('');
      setAddress('');
      setEmail('');
      setPhone('');
      setSubject('');
      setRequestText('');
      setPeriod('');
      setComments('');
      setConsent(false);
      setShowPrivacyInfo(false);
      setErrors({});
      setAiPrefilled({});
      setDocuments([]);
      setIsLoading(false);
      setIsPrefilling(false);

      // Fetch AI prefill
      if (accessToken) {
        fetchPrefill(accessToken);
      }
    }
  }, [isOpen, accessToken]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isLoading, onClose]);

  const fetchPrefill = useCallback(async (token: string) => {
    setIsPrefilling(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/woo-requests/${token}/prefill/`, { credentials: 'include' });
      if (!res.ok) throw new Error('Prefill request failed');
      const data = await res.json();

      const prefilled: Record<string, boolean> = {};

      if (data.subject) {
        setSubject(data.subject);
        prefilled.subject = true;
      }
      if (data.request_text) {
        setRequestText(data.request_text);
        prefilled.request_text = true;
      }
      if (data.period) {
        setPeriod(data.period);
        prefilled.period = true;
      }
      if (data.documents && data.documents.length > 0) {
        setDocuments(data.documents);
      }

      setAiPrefilled(prefilled);
    } catch (err) {
      console.error('Failed to fetch prefill:', err);
    } finally {
      setIsPrefilling(false);
    }
  }, []);

  const clearAiField = useCallback((field: string) => {
    switch (field) {
      case 'subject':
        setSubject('');
        break;
      case 'request_text':
        setRequestText('');
        break;
      case 'period':
        setPeriod('');
        break;
    }
    setAiPrefilled(prev => ({ ...prev, [field]: false }));
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'Voornaam of initialen is verplicht';
    if (!lastName.trim()) newErrors.lastName = 'Achternaam is verplicht';
    if (!address.trim()) newErrors.address = 'Adres is verplicht';
    if (!email.trim()) {
      newErrors.email = 'E-mailadres is verplicht';
    } else {
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(email)) newErrors.email = 'Ongeldig e-mailadres';
    }
    if (!subject.trim()) newErrors.subject = 'Onderwerp is verplicht';
    if (!requestText.trim()) newErrors.requestText = 'Informatieverzoek is verplicht';
    if (!period.trim()) newErrors.period = 'Periode is verplicht';
    if (!consent) newErrors.consent = 'Toestemmingsverklaring is verplicht';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [firstName, lastName, address, email, subject, requestText, period, consent]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        middle_name: middleName.trim(),
        last_name: lastName.trim(),
        organization: organization.trim(),
        address: address.trim(),
        email: email.trim(),
        phone: phone.trim(),
        subject: subject.trim(),
        request_text: requestText.trim(),
        period: period.trim(),
        comments: comments.trim(),
        consent: true,
        submission_type: submissionType,
      };

      const res = await fetch(`${BACKEND_URL}/api/woo-requests/${accessToken}/submit-form/`, {
        method: 'POST',
        headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Er is een fout opgetreden' }));
        throw new Error(errData.error || 'Indienen mislukt');
      }

      toast.success('Uw verzoek is succesvol ingediend!', {
        position: 'top-right',
        autoClose: 3000,
      });

      onClose();
      navigate(`/completed-request?accessToken=${accessToken}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Er is een fout opgetreden', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [firstName, middleName, lastName, organization, address, email, phone, subject, requestText, period, comments, consent, submissionType, accessToken, validate, onClose, navigate]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('access_token', accessToken);

    try {
      const res = await fetch(`${BACKEND_URL}/api/conversations/upload/`, {
        method: 'POST',
        headers: getCSRFHeaders(),
        body: formData,
        credentials: 'include'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload mislukt');
      }

      const data = await res.json();
      if (data.document) {
        setDocuments(prev => {
          const next = [...prev];
          if (slotIndex < next.length) {
            next[slotIndex] = data.document;
          } else {
            next.push(data.document);
          }
          return next;
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bestand uploaden mislukt', {
        position: 'top-right',
      });
    }
  }, [accessToken]);

  const removeDocument = useCallback((index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const submissionTypeLabel = submissionType === 'woo_verzoek' ? 'WOO verzoek' : 'Informatieverzoek';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white w-full max-w-2xl my-8 mx-4 rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-lg z-10">
          <h2 className="text-xl font-bold text-[#154273]">{submissionTypeLabel} indienen</h2>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Sluiten"
            >
              <IconX className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ─── Personal Details ─── */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-[#154273] mb-2">Persoonsgegevens</legend>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Voornaam of initialen"
                required
                error={errors.firstName}
              >
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })); }}
                  className={inputClass(errors.firstName)}
                  placeholder="bijv. J. of Jan"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Tussenvoegsel(s)">
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  className={inputClass()}
                  placeholder="bijv. van der"
                  disabled={isLoading}
                />
              </FormField>
            </div>

            <FormField label="Achternaam" required error={errors.lastName}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: '' })); }}
                className={inputClass(errors.lastName)}
                placeholder="bijv. Jansen"
                disabled={isLoading}
              />
            </FormField>

            <FormField label="Organisatie">
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className={inputClass()}
                placeholder="Optioneel"
                disabled={isLoading}
              />
            </FormField>

            <FormField label="Adres" required error={errors.address}>
              <input
                type="text"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setErrors(p => ({ ...p, address: '' })); }}
                className={inputClass(errors.address)}
                placeholder="bijv. Kerkstraat 1, 1234 AB Den Haag"
                disabled={isLoading}
              />
            </FormField>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="E-mailadres" required error={errors.email}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                  className={inputClass(errors.email)}
                  placeholder="voorbeeld@email.nl"
                  disabled={isLoading}
                />
              </FormField>

              <FormField label="Telefoonnummer">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass()}
                  placeholder="+31 6 12345678"
                  disabled={isLoading}
                />
              </FormField>
            </div>
          </fieldset>

          {/* ─── Request Details (AI-prefilled) ─── */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-[#154273] mb-2">
              Verzoekgegevens
              {isPrefilling && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  <IconLoader2 className="inline-block w-4 h-4 animate-spin mr-1" />
                  Automatisch vult velden in...
                </span>
              )}
            </legend>

            <AiField
              label="Onderwerp"
              required
              error={errors.subject}
              aiPrefilled={aiPrefilled.subject}
              onClear={() => clearAiField('subject')}
              description='Beschrijf het onderwerp van uw verzoek in een paar woorden, bijvoorbeeld "aanpak jeugdcriminaliteit in 2022"'
            >
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setErrors(p => ({ ...p, subject: '' })); setAiPrefilled(p => ({ ...p, subject: false })); }}
                className={inputClass(errors.subject)}
                placeholder={isPrefilling ? 'AI is bezig...' : 'bijv. Aanpak jeugdcriminaliteit in 2022'}
                disabled={isLoading || isPrefilling}
              />
            </AiField>

            <AiField
              label={submissionTypeLabel}
              required
              error={errors.requestText}
              aiPrefilled={aiPrefilled.request_text}
              onClear={() => clearAiField('request_text')}
              description="Beschrijf zo specifiek mogelijk welke informatie u zoekt. Denk bijvoorbeeld aan een specifieke periode of een verwijzing naar een artikel of eerder verzoek."
            >
              <textarea
                value={requestText}
                onChange={(e) => { setRequestText(e.target.value); setErrors(p => ({ ...p, requestText: '' })); setAiPrefilled(p => ({ ...p, request_text: false })); }}
                className={`${inputClass(errors.requestText)} min-h-[120px] resize-y`}
                placeholder={isPrefilling ? 'AI is bezig...' : 'Beschrijf zo specifiek mogelijk welke informatie u zoekt...'}
                disabled={isLoading || isPrefilling}
                rows={5}
              />
            </AiField>

            <AiField
              label="Periode van het verzoek"
              required
              error={errors.period}
              aiPrefilled={aiPrefilled.period}
              onClear={() => clearAiField('period')}
              description='U kunt de periode aangeven waarvan u documenten wilt ontvangen, bijvoorbeeld: "januari tot en met maart 2025".'
            >
              <input
                type="text"
                value={period}
                onChange={(e) => { setPeriod(e.target.value); setErrors(p => ({ ...p, period: '' })); setAiPrefilled(p => ({ ...p, period: false })); }}
                className={inputClass(errors.period)}
                placeholder={isPrefilling ? 'AI is bezig...' : 'bijv. januari 2023 tot en met december 2024'}
                disabled={isLoading || isPrefilling}
              />
            </AiField>
          </fieldset>

          {/* ─── Appendixes ─── */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold text-[#154273] mb-2">Bijlagen</legend>
            <p className="text-sm text-gray-600">
              Heeft u bestanden met informatie over uw verzoek, of heeft u een machtiging? Voeg deze hier toe.
            </p>

            {[0, 1].map((idx) => (
              <div key={idx} className="flex items-center gap-3">
                <label className="text-sm font-medium text-[#154273] min-w-[80px]">
                  Bijlage {idx + 1}
                </label>
                {documents[idx] ? (
                  <div className="flex items-center gap-2 flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    <IconPaperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 truncate flex-1">{documents[idx].filename}</span>
                    <button
                      type="button"
                      onClick={() => removeDocument(idx)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload(e, idx)}
                    disabled={isLoading}
                    className="text-base text-gray-600 file:mr-3 file:py-2 file:px-4 file:border-0 file:text-base file:bg-[#03689B] file:text-white file:cursor-pointer file:display-inline-block"
                  />
                )}
              </div>
            ))}
          </fieldset>

          {/* ─── Comments ─── */}
          <fieldset className="space-y-2">
            <legend className="text-lg font-semibold text-[#154273] mb-2">Opmerkingen</legend>
            <p className="text-sm text-gray-600">
              U kunt optioneel extra informatie meesturen met uw Woo-verzoek. Voor de behandeling van uw verzoek hoeft u geen informatie te verstrekken buiten de verplichte velden in dit formulier.
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={`${inputClass()} min-h-[80px] resize-y`}
              placeholder="Optionele opmerkingen..."
              disabled={isLoading}
              rows={3}
            />
          </fieldset>

          {/* ─── Privacy Information ─── */}
          <fieldset className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
            <div className="text-base font-semibold text-[#154273]">
              Informatie over de verwerking van uw persoonsgegevens
            </div>

            <div className="text-sm text-gray-700 leading-relaxed">
              <p>
                Dit formulier kan worden gebruikt om een Woo-verzoek in te dienen bij het bestuursdepartement van het Ministerie van Justitie en Veiligheid.
                De informatie die in dit formulier wordt verstrekt, wordt gebruikt om het Woo-verzoek te behandelen.
                Zonder de informatie uit dit formulier kunnen wij uw verzoek niet behandelen.
                    Uw gehele verzoek, inclusief persoonsgegevens, wordt op grond van de Archiefwet en de selectielijsten van het Ministerie van Justitie en Veiligheid permanent bewaard.
                    Twintig jaar na sluiting van het dossier wordt het overgebracht naar het Nationaal Archief; openbaarmaking van dergelijke dossiers vindt pas 75 jaar na sluiting van het dossier plaats.
                    Indien uw verzoek niet door het Ministerie van Justitie en Veiligheid kan worden beantwoord maar (waarschijnlijk) door een ander bestuursorgaan, verplicht de Wet open overheid het ministerie om uw Woo-verzoek door te sturen naar het juiste orgaan.
                    In dergelijke gevallen worden uw gehele verzoek, inclusief uw persoonsgegevens, gedeeld met het betreffende bestuursorgaan.
              </p>
            </div>

            {/* Dropdown for additional privacy information */}
            <div className="border-t border-gray-300 pt-3 mt-3">
              <div className="flex items-center gap-2 justify-between pr-1">
                <span className="text-sm text-[#154273]">Toon extra informatie over de verwerking van uw persoonsgegevens</span>
                <button
                  type="button"
                  onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                  className="flex-shrink-0 w-6 h-6 rounded-full border border-[#F68153] flex items-center justify-center hover:bg-[#F68153]/10 transition-colors"
                  aria-label="Toggle privacy details"
                >
                  <IconChevronDown 
                    className={`h-3 w-3 text-[#F68153] transition-transform ${showPrivacyInfo ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {showPrivacyInfo && (
                <div className="mt-2 p-3 bg-white border border-[#F68153] rounded text-sm text-[#154273] shadow-lg space-y-4 leading-relaxed">
                  <div>
                    <h4 className="font-semibold text-[#154273] mb-2">Waarom worden deze gegevens gevraagd?</h4>
                    <p>
                      Wij gebruiken de door u verstrekte gegevens bij de behandeling van uw Woo-verzoek, bijvoorbeeld om contact op te nemen om uw vraag te verhelderen. Als wij een besluit hebben genomen op uw verzoek, gebruiken wij uw contactgegevens om dit naar u toe te sturen. Zonder uw persoonsgegevens kunnen wij uw verzoek niet behandelen. Wij gebruiken uw gegevens, met uw toestemming, omdat wij anders niet in staat zijn uw Woo-verzoek te behandelen. In enkele gevallen, bijvoorbeeld bij verstrekking van documenten die de verzoeker betreft, kan u worden gevraagd om meer persoonsgegevens aan te leveren om uw identiteit te controleren. Mocht dit op uw verzoek van toepassing zijn, nemen wij contact met u op.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#154273] mb-2">Op welke manier worden uw gegevens verwerkt?</h4>
                    <p>
                      De gegevens uit dit Woo-verzoekformulier worden alleen gebruikt voor de behandeling van uw Woo-verzoek. Uw Woo-verzoek is in zijn geheel, inclusief persoonsgegevens, inzichtelijk door medewerkers van de directie Openbaarmaking en andere Woo-juristen van het ministerie van Justitie en Veiligheid. Tevens zijn uw persoonsgegevens inzichtelijk voor medewerkers uit het postproces, zij registeren het ontvangst van uw Woo-verzoek en verzenden (desgewenst) per post het besluit op uw Woo-verzoek. Uw gegevens worden niet gedeeld of opgeslagen buiten de Europese Economische Ruimte (EER). Bij doorzending delen wij uw persoonsgegevens met andere bestuursorganen die onder de Wet open overheid vallen. Mogelijk wijken de bewaartermijnen van deze instantie af van die van het ministerie van Justitie en Veiligheid, selectielijsten worden per organisatie opgesteld. Wij zullen u altijd informeren over een doorzending.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#154273] mb-2">Hoelang bewaren wij uw gegevens?</h4>
                    <p>
                      Werkzaamheden ten behoeve van Woo-verzoeken vallen onder de Archiefwet. Dit betekent dat uw Woo-verzoek (inclusief persoonsgegevens) en eventuele gerelateerde documenten worden bewaard conform de selectielijsten van het ministerie van Justitie en Veiligheid voor een periode van twintig jaar na sluiting van het dossier; daarna zal het dossier overgedragen worden aan het Nationaal Archief voor blijvende bewaring. Na overdracht aan het Nationaal Archief wordt het dossier, inclusief uw persoonsgegevens, door het Ministerie van Justitie en Veiligheid uit onze systemen verwijderd.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[#03689B] hover:underline mt-3"
            >
              Bekijk volledige privacyverklaring →
            </a>
          </fieldset>

          {/* ─── Consent ─── */}
          <fieldset>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => { setConsent(e.target.checked); setErrors(p => ({ ...p, consent: '' })); }}
                className="mt-1 w-4 h-4 accent-[#03689B]"
                disabled={isLoading}
              />
              <label htmlFor="consent" className="text-sm text-[#154273]">
                <span className="font-medium">Toestemmingsverklaring</span> <span className="text-red-500">*</span>
                <br />
                Ik heb gelezen en begrepen wat er met mijn persoonsgegevens gebeurt.
              </label>
            </div>
            {errors.consent && <p className="text-sm text-red-600 mt-1">{errors.consent}</p>}
          </fieldset>

          {/* ─── Actions ─── */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-base display-inline-block bg-gray-100 mt-2 self-start text-gray-700 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="text-base display-inline-block bg-[#03689B] mt-2 self-start text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Bezig met indienen...
                </>
              ) : (
                `${submissionTypeLabel} indienen`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// ─── Helper components ───

function inputClass(error?: string): string {
  return `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#03689B] ${
    error ? 'border-red-500' : 'border-gray-300'
  } disabled:bg-gray-100 disabled:cursor-not-allowed`;
}

function FormField({
  label,
  required,
  error,
  children,
  description,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#154273] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function AiField({
  label,
  required,
  error,
  aiPrefilled,
  onClear,
  children,
  description,
}: {
  label: string;
  required?: boolean;
  error?: string;
  aiPrefilled?: boolean;
  onClear: () => void;
  children: React.ReactNode;
  description?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm font-medium text-[#154273]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {aiPrefilled && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
            <IconSparkles className="w-3 h-3" />
            Automatisch ingevuld
            <button
              type="button"
              onClick={onClear}
              className="ml-0.5 text-purple-500 hover:text-purple-800"
              aria-label="AI-invulling wissen"
            >
              <IconX className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>
      {description && <p className="text-xs text-gray-500 mb-1">{description}</p>}
      {children}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export default WooSubmitModal;
