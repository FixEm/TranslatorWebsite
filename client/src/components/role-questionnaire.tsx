import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  ArrowRight, 
  Languages, 
  MapPin, 
  Upload,
  FileText,
  Clock,
  Heart,
  Calendar
} from "lucide-react";

interface TranslatorAnswers {
  fluentLanguages: string[];
  experience: string;
  specializations: string[];
  sampleWork?: File;
  motivation: string;
  customMotivation?: string;
}

interface TourGuideAnswers {
  experience: string;
  cities: string[];
  languages: string[];
  culturalKnowledge: 'basic' | 'intermediate' | 'advanced' | '';
  publicSpeaking: 'yes' | 'no' | '';
  motivation: string;
  customMotivation?: string;
}

interface RoleQuestionnaireProps {
  selectedRole: 'translator' | 'tour_guide' | null;
  onComplete: (answers: TranslatorAnswers | TourGuideAnswers) => void;
  onBack: () => void;
}

const FLUENT_LANGUAGES = [
  'Bahasa Indonesia',
  'English',
  'Mandarin Chinese', 
  'Hokkien',
  'Cantonese',
  'Hakka',
  'Teochew',
  'Japanese',
  'Korean',
  'Arabic',
  'Dutch',
  'German',
  'French',
  'Spanish'
];

const SPECIALIZATIONS = [
  'Tourism',
  'Academic',
  'Business',
  'Medical',
  'Legal',
  'Technical',
  'General Conversation'
];

const MAJOR_CITIES = [
  'Beijing',
  'Shanghai',
  'Guangzhou',
  'Shenzhen',
  'Chengdu',
  'Xi\'an',
  'Hangzhou',
  'Nanjing',
  'Suzhou',
  'Wuhan'
];

const GUIDE_LANGUAGES = [
  'Indonesian',
  'English',
  'Mandarin Chinese',
  'Hokkien',
  'Cantonese',
  'Japanese',
  'Korean'
];

const AVAILABILITY_OPTIONS = [
  'Weekends',
  'Weekdays',
  'Holidays',
  'Summer Break',
  'Semester Break',
  'Evening (after classes)',
  'Flexible'
];

export default function RoleQuestionnaire({ selectedRole, onComplete, onBack }: RoleQuestionnaireProps) {
  // Initialize currentStep based on selectedRole
  const [currentStep, setCurrentStep] = useState<'translator' | 'tour_guide'>(
    selectedRole === 'tour_guide' ? 'tour_guide' : 'translator'
  );
  
  // Translator form state
  const [translatorAnswers, setTranslatorAnswers] = useState<TranslatorAnswers>({
    fluentLanguages: [],
    experience: '',
    specializations: [],
    motivation: ''
  });

  // Tour guide form state
  const [tourGuideAnswers, setTourGuideAnswers] = useState<TourGuideAnswers>({
    experience: '',
    cities: [],
    languages: [],
    culturalKnowledge: '',
    publicSpeaking: '',
    motivation: ''
  });

  const handleTranslatorSubmit = () => {
    onComplete(translatorAnswers);
  };

  const handleTourGuideSubmit = () => {
    onComplete(tourGuideAnswers);
  };

  const handleFileUpload = (file: File) => {
    setTranslatorAnswers(prev => ({ ...prev, sampleWork: file }));
  };

  const toggleArrayItem = (array: string[], item: string, setter: (items: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const isTranslatorValid = translatorAnswers.fluentLanguages.length > 0 && 
                           translatorAnswers.experience.trim() !== '' && 
                           translatorAnswers.specializations.length > 0 && 
                           translatorAnswers.motivation.trim() !== '' &&
                           (translatorAnswers.motivation !== "Others" || (translatorAnswers.customMotivation && translatorAnswers.customMotivation.trim() !== ''));

  const isTourGuideValid = tourGuideAnswers.experience.trim() !== '' && 
                          tourGuideAnswers.cities.length > 0 && 
                          tourGuideAnswers.languages.length > 0 && 
                          tourGuideAnswers.culturalKnowledge !== '' && 
                          tourGuideAnswers.publicSpeaking !== '' && 
                          tourGuideAnswers.motivation.trim() !== '' &&
                          (tourGuideAnswers.motivation !== "Others" || (tourGuideAnswers.customMotivation && tourGuideAnswers.customMotivation.trim() !== ''));

  const shouldShowTranslator = selectedRole === 'translator';
  const shouldShowTourGuide = selectedRole === 'tour_guide';

  if (shouldShowTranslator && currentStep === 'translator') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-blue-500" />
              Kuesioner Penerjemah
            </CardTitle>
            <CardDescription>
              Ceritakan tentang pengalaman dan kemampuan Anda sebagai penerjemah
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Fluent Languages */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Bahasa yang Anda kuasai dengan lancar *</Label>
              <p className="text-sm text-gray-600">Pilih semua bahasa yang Anda kuasai dengan lancar (bisa pilih lebih dari 1)</p>
              <div className="grid grid-cols-2 gap-3">
                {FLUENT_LANGUAGES.map(language => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={translatorAnswers.fluentLanguages.includes(language)}
                      onCheckedChange={() => 
                        toggleArrayItem(
                          translatorAnswers.fluentLanguages, 
                          language, 
                          (items) => setTranslatorAnswers(prev => ({ ...prev, fluentLanguages: items }))
                        )
                      }
                    />
                    <Label htmlFor={language} className="text-sm">{language}</Label>
                  </div>
                ))}
              </div>
              {translatorAnswers.fluentLanguages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {translatorAnswers.fluentLanguages.map(language => (
                    <Badge key={language} variant="secondary">{language}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="translator-experience" className="text-base font-medium">
                Pengalaman menerjemahkan (bisa informal - tugas kuliah, volunteer, klub) *
              </Label>
              <Textarea
                id="translator-experience"
                placeholder="Jelaskan pengalaman Anda dalam menerjemahkan, meski hanya dari tugas kuliah atau kegiatan volunteer..."
                value={translatorAnswers.experience}
                onChange={(e) => setTranslatorAnswers(prev => ({ ...prev, experience: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            {/* Specializations */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Area spesialisasi *</Label>
              <div className="grid grid-cols-2 gap-3">
                {SPECIALIZATIONS.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={spec}
                      checked={translatorAnswers.specializations.includes(spec)}
                      onCheckedChange={() => 
                        toggleArrayItem(
                          translatorAnswers.specializations, 
                          spec, 
                          (items) => setTranslatorAnswers(prev => ({ ...prev, specializations: items }))
                        )
                      }
                    />
                    <Label htmlFor={spec} className="text-sm">{spec}</Label>
                  </div>
                ))}
              </div>
              {translatorAnswers.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {translatorAnswers.specializations.map(spec => (
                    <Badge key={spec} variant="secondary">{spec}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Motivation */}
            <div className="space-y-2">
              <Label htmlFor="translator-motivation" className="text-base font-medium">
                Mengapa Anda ingin bekerja sebagai penerjemah? *
              </Label>
              <Select value={translatorAnswers.motivation} onValueChange={(value) => setTranslatorAnswers(prev => ({ ...prev, motivation: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan utama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penghasilan Tambahan">Penghasilan Tambahan</SelectItem>
                  <SelectItem value="Mengisi waktu luang">Mengisi waktu luang</SelectItem>
                  <SelectItem value="Melatih Penggunaan Bahasa">Melatih Penggunaan Bahasa</SelectItem>
                  <SelectItem value="Mendapat Koneksi">Mendapat Koneksi</SelectItem>
                  <SelectItem value="Tambah pengalaman kerja">Tambah pengalaman kerja</SelectItem>
                  <SelectItem value="Menjadi alasan untuk explore kota">Menjadi alasan untuk explore kota</SelectItem>
                  <SelectItem value="Others">Lainnya</SelectItem>
                </SelectContent>
              </Select>
              {translatorAnswers.motivation === "Others" && (
                <Textarea
                  placeholder="Tuliskan alasan Anda..."
                  value={translatorAnswers.customMotivation || ''}
                  onChange={(e) => setTranslatorAnswers(prev => ({ ...prev, customMotivation: e.target.value }))}
                  className="min-h-[80px] mt-2"
                  required
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={handleTranslatorSubmit}
                disabled={!isTranslatorValid}
              >
                Lanjut ke Registrasi
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (shouldShowTourGuide) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              Kuesioner Tour Guide
            </CardTitle>
            <CardDescription>
              Ceritakan tentang pengalaman dan kemampuan Anda sebagai tour guide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="guide-experience" className="text-base font-medium">
                Pengalaman sebagai tour guide (klub mahasiswa, program pertukaran, volunteer, agencies) *
              </Label>
              <Textarea
                id="guide-experience"
                placeholder="Jelaskan pengalaman Anda sebagai tour guide, termasuk kegiatan klub, program pertukaran, volunteer, atau bekerja dengan agencies..."
                value={tourGuideAnswers.experience}
                onChange={(e) => setTourGuideAnswers(prev => ({ ...prev, experience: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>

            {/* Cities */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Kota atau lokasi utama yang bisa Anda guide *</Label>
              <Select value={tourGuideAnswers.cities[0] || ''} onValueChange={(value) => setTourGuideAnswers(prev => ({ ...prev, cities: [value] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kota utama" />
                </SelectTrigger>
                <SelectContent>
                  {MAJOR_CITIES.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Languages */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Pilih semua bahasa *</Label>
              <p className="text-sm text-gray-600">Pilih semua bahasa yang Anda kuasai dengan lancar (bisa pilih lebih dari 1)</p>
              <div className="grid grid-cols-2 gap-3">
                {FLUENT_LANGUAGES.map(language => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={tourGuideAnswers.languages.includes(language)}
                      onCheckedChange={() => 
                        toggleArrayItem(
                          tourGuideAnswers.languages, 
                          language, 
                          (items) => setTourGuideAnswers(prev => ({ ...prev, languages: items }))
                        )
                      }
                    />
                    <Label htmlFor={language} className="text-sm">{language}</Label>
                  </div>
                ))}
              </div>
              {tourGuideAnswers.languages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tourGuideAnswers.languages.map(lang => (
                    <Badge key={lang} variant="secondary">{lang}</Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Cultural Knowledge */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Pengetahuan tentang sejarah/budaya lokal *</Label>
              <RadioGroup
                value={tourGuideAnswers.culturalKnowledge}
                onValueChange={(value) => setTourGuideAnswers(prev => ({ 
                  ...prev, 
                  culturalKnowledge: value as 'basic' | 'intermediate' | 'advanced' 
                }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic">Basic - Pengetahuan dasar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate">Intermediate - Cukup mengetahui</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced">Advanced - Sangat menguasai</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Public Speaking */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Nyaman berbicara di depan umum? *</Label>
              <RadioGroup
                value={tourGuideAnswers.publicSpeaking}
                onValueChange={(value) => setTourGuideAnswers(prev => ({ 
                  ...prev, 
                  publicSpeaking: value as 'yes' | 'no' 
                }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes">Ya, saya nyaman berbicara di depan umum</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no">Tidak, saya masih perlu berlatih</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Motivation */}
            <div className="space-y-2">
              <Label htmlFor="guide-motivation" className="text-base font-medium">
                Mengapa Anda ingin bekerja sebagai tour guide? *
              </Label>
              <Select value={tourGuideAnswers.motivation} onValueChange={(value) => setTourGuideAnswers(prev => ({ ...prev, motivation: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan utama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Penghasilan Tambahan">Penghasilan Tambahan</SelectItem>
                  <SelectItem value="Mengisi waktu luang">Mengisi waktu luang</SelectItem>
                  <SelectItem value="Melatih Penggunaan Bahasa">Melatih Penggunaan Bahasa</SelectItem>
                  <SelectItem value="Mendapat Koneksi">Mendapat Koneksi</SelectItem>
                  <SelectItem value="Tambah pengalaman kerja">Tambah pengalaman kerja</SelectItem>
                  <SelectItem value="Menjadi alasan untuk explore kota">Menjadi alasan untuk explore kota</SelectItem>
                  <SelectItem value="Others">Lainnya</SelectItem>
                </SelectContent>
              </Select>
              {tourGuideAnswers.motivation === "Others" && (
                <Textarea
                  placeholder="Tuliskan alasan Anda..."
                  value={tourGuideAnswers.customMotivation || ''}
                  onChange={(e) => setTourGuideAnswers(prev => ({ ...prev, customMotivation: e.target.value }))}
                  className="min-h-[80px] mt-2"
                  required
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali
              </Button>
              <Button 
                onClick={handleTourGuideSubmit}
                disabled={!isTourGuideValid}
              >
                Lanjut ke Registrasi
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
