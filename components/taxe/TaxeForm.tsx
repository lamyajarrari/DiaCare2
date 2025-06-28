// DIACARE/components/taxe/TaxeForm.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Importations des composants Shadcn UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';

// Pour la gestion de formulaire (React Hook Form et Zod)
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Pour le composant Form de Shadcn UI
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Utilitaires
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';

// Importations pour la génération de PDF
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Schéma de validation Zod ---
const formSchema = z.object({
  patientName: z.string().min(2, { message: "Le nom du patient est requis." }),
  medicalRecordNumber: z.string().min(1, { message: "Le N° Dossier Médical est requis." }),
  sessionDate: z.date({ required_error: "La date de la séance est requise." }),
  sessionTimeFrom: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Heure de début invalide." }).optional().or(z.literal('')),
  sessionTimeTo: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Heure de fin invalide." }).optional().or(z.literal('')),
  responsibleDoctor: z.string().min(2, { message: "Le nom du médecin est requis." }),
  dialysisFee: z.coerce.number().min(0, { message: "Le montant doit être positif." }),
  generatorDialyzer: z.coerce.number().min(0, { message: "Le montant doit être positif." }),
  medConsumables: z.coerce.number().min(0, { message: "Le montant doit être positif." }),
  nursingCare: z.coerce.number().min(0, { message: "Le montant doit être positif." }),
  adminFees: z.coerce.number().min(0, { message: "Le montant doit être positif." }),
  taxPercentage: z.coerce.number().min(0).max(100, { message: "Le pourcentage de taxe doit être entre 0 et 100." }),
  paymentMethod: z.array(z.string()).min(1, { message: "Veuillez sélectionner au moins un mode de paiement." }),
  paymentReference: z.string().optional(),
  observations: z.string().optional(),
});

type TaxeFormValues = z.infer<typeof formSchema>;

const TaxeForm = () => {
  const router = useRouter();
  const formContentRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const form = useForm<TaxeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: '',
      medicalRecordNumber: '',
      sessionDate: undefined,
      sessionTimeFrom: '',
      sessionTimeTo: '',
      responsibleDoctor: '',
      dialysisFee: 800,
      generatorDialyzer: 150,
      medConsumables: 100,
      nursingCare: 50,
      adminFees: 20,
      taxPercentage: 0,
      paymentMethod: [],
      paymentReference: '',
      observations: '',
    },
  });

  const [subTotal, setSubTotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);

  const watchedDialysisFee = form.watch('dialysisFee');
  const watchedGeneratorDialyzer = form.watch('generatorDialyzer');
  const watchedMedConsumables = form.watch('medConsumables');
  const watchedNursingCare = form.watch('nursingCare');
  const watchedAdminFees = form.watch('adminFees');
  const watchedTaxPercentage = form.watch('taxPercentage');

  useEffect(() => {
    const calculatedSubTotal =
      (watchedDialysisFee || 0) +
      (watchedGeneratorDialyzer || 0) +
      (watchedMedConsumables || 0) +
      (watchedNursingCare || 0) +
      (watchedAdminFees || 0);
    setSubTotal(calculatedSubTotal);
  }, [
    watchedDialysisFee,
    watchedGeneratorDialyzer,
    watchedMedConsumables,
    watchedNursingCare,
    watchedAdminFees,
  ]);

  useEffect(() => {
    const calculatedTaxAmount = (subTotal * (watchedTaxPercentage || 0)) / 100;
    setTaxAmount(calculatedTaxAmount);
    setTotalToPay(subTotal + calculatedTaxAmount);
  }, [subTotal, watchedTaxPercentage]);

  const onSubmit = async (values: TaxeFormValues) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const dataToSend = { 
      ...values, 
      subTotal, 
      taxAmount, 
      totalToPay,
      sessionDate: values.sessionDate?.toISOString()
    };

    try {
      const response = await fetch('/api/taxe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('Facture générée avec succès !');
        form.reset();
        
        // Auto-generate PDF after successful submission
        setTimeout(() => {
          handleDownloadPdf();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la génération de la facture.');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      setError('Une erreur réseau est survenue. Veuillez vérifier votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonction pour générer et télécharger le PDF
  const handleDownloadPdf = async () => {
    if (!formContentRef.current) {
      setError("Impossible de capturer le formulaire pour le PDF.");
      return;
    }

    setIsGeneratingPdf(true);
    setError("");

    try {
      const input = formContentRef.current;
      
      // Attendre que le DOM soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Temporarily hide buttons and alerts for PDF generation
      const buttons = input.querySelectorAll('button');
      const alerts = input.querySelectorAll('[role="alert"]');
      const popoverTriggers = input.querySelectorAll('[data-radix-popper-content-wrapper]');
      
      buttons.forEach(btn => (btn as HTMLElement).style.display = 'none');
      alerts.forEach(alert => (alert as HTMLElement).style.display = 'none');
      popoverTriggers.forEach(popover => (popover as HTMLElement).style.display = 'none');

      // Attendre encore un peu pour que les éléments soient cachés
      await new Promise(resolve => setTimeout(resolve, 200));

      // Créer une copie du contenu pour la capture
      const clone = input.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.width = '800px'; // Largeur fixe pour une meilleure qualité
      clone.style.backgroundColor = '#ffffff';
      clone.style.padding = '20px';
      clone.style.margin = '0';
      clone.style.border = 'none';
      clone.style.boxShadow = 'none';
      
      // Supprimer les éléments interactifs du clone
      const cloneButtons = clone.querySelectorAll('button');
      const cloneAlerts = clone.querySelectorAll('[role="alert"]');
      const clonePopovers = clone.querySelectorAll('[data-radix-popper-content-wrapper]');
      
      cloneButtons.forEach(btn => btn.remove());
      cloneAlerts.forEach(alert => alert.remove());
      clonePopovers.forEach(popover => popover.remove());

      // Ajouter le clone au DOM temporairement
      document.body.appendChild(clone);

      // Attendre que le clone soit rendu
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: clone.scrollHeight,
        windowWidth: 800,
        windowHeight: clone.scrollHeight,
        logging: false,
        allowTaint: true,
        foreignObjectRendering: true,
      });

      // Nettoyer le clone
      document.body.removeChild(clone);

      // Restore buttons and alerts
      buttons.forEach(btn => (btn as HTMLElement).style.display = '');
      alerts.forEach(alert => (alert as HTMLElement).style.display = '');
      popoverTriggers.forEach(popover => (popover as HTMLElement).style.display = '');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const patientName = form.getValues('patientName') || 'patient';
      const fileName = `facture_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      setSuccess('PDF généré et téléchargé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setError('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getControlTypeLabel = (type) => {
    const labels = {
      '3_months': 'Contrôle trimestriel (3 mois)',
      '6_months': 'Contrôle semestriel (6 mois)',
      '1_year': 'Contrôle annuel (1 an)'
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header with navigation and actions */}
        <div className="flex justify-between items-center mb-6 px-4 py-3 bg-white shadow-md rounded-lg">
          <Button onClick={() => router.push('/dashboard/admin')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au Tableau de Bord
          </Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleDownloadPdf} 
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isGeneratingPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? "Génération..." : "Télécharger PDF"}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Form content - This will be captured for PDF */}
        <div ref={formContentRef} className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h2 className="text-3xl font-bold text-blue-700 mb-2">Centre Hospitalier Universitaire (CHU Agadir)</h2>
            <p className="text-sm text-gray-600">Adresse : CHU Agadir, 80000 Agadir, Maroc</p>
            <p className="text-sm text-gray-600">Tél : 0528 564 512</p>
            <h3 className="text-2xl font-semibold text-gray-800 mt-4">FACTURE DE DIALYSE</h3>
          </div>

          {/* Informations Patient - Version PDF optimisée */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informations Patient</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Nom et Prénom :</strong> {form.watch('patientName') || '________________'}
              </div>
              <div>
                <strong>N° Dossier Médical :</strong> {form.watch('medicalRecordNumber') || '________________'}
              </div>
              <div>
                <strong>Date de la Séance :</strong> {form.watch('sessionDate') ? format(form.watch('sessionDate'), 'dd/MM/yyyy') : '________________'}
              </div>
              <div>
                <strong>Heure :</strong> {form.watch('sessionTimeFrom') || '___'} - {form.watch('sessionTimeTo') || '___'}
              </div>
              <div>
                <strong>Médecin Responsable :</strong> {form.watch('responsibleDoctor') || '________________'}
              </div>
            </div>
          </div>

          {/* Détail des Frais - Version PDF optimisée */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Détail des Frais</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Séance de dialyse :</span>
                <span>{form.watch('dialysisFee') || 0} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Générateur + dialyseur :</span>
                <span>{form.watch('generatorDialyzer') || 0} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Médicaments et consommables :</span>
                <span>{form.watch('medConsumables') || 0} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Soins infirmiers spécialisés :</span>
                <span>{form.watch('nursingCare') || 0} MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Frais administratifs :</span>
                <span>{form.watch('adminFees') || 0} MAD</span>
              </div>
            </div>
            
            {/* Totals */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex justify-between font-bold">
                <span>Sous-total :</span>
                <span>{subTotal.toFixed(2)} MAD</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Taxe ({form.watch('taxPercentage') || 0}%) :</span>
                <span>{taxAmount.toFixed(2)} MAD</span>
              </div>
              <div className="flex justify-between font-extrabold text-lg border-t pt-2">
                <span>Total à Payer :</span>
                <span>{totalToPay.toFixed(2)} MAD</span>
              </div>
            </div>
          </div>

          {/* Mode de Paiement - Version PDF optimisée */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Mode de Paiement</h4>
            <div className="text-sm">
              <div className="mb-2">
                <strong>Mode(s) de paiement :</strong> {form.watch('paymentMethod')?.join(', ') || '________________'}
              </div>
              {form.watch('paymentReference') && (
                <div>
                  <strong>Référence de paiement :</strong> {form.watch('paymentReference')}
                </div>
              )}
            </div>
          </div>

          {/* Observations - Version PDF optimisée */}
          {form.watch('observations') && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Observations</h4>
              <div className="text-sm">
                {form.watch('observations')}
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between items-end mt-8 pt-6 border-t border-dashed border-gray-300">
            <div className="text-center flex-1">
              <div className="text-sm font-semibold mb-2">Signature Patient :</div>
              <div className="border-b border-black w-3/4 mx-auto h-8"></div>
            </div>
            <div className="text-center flex-1">
              <div className="text-sm font-semibold mb-2">Cachet du Centre :</div>
              <div className="border-b border-black w-3/4 mx-auto h-8"></div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Section Informations Patient */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">Informations Patient</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="patientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom et Prénom *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom complet du patient" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalRecordNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>N° Dossier Médical *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: DM00123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sessionDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date de la Séance *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sessionTimeFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure (Début)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sessionTimeTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure (Fin)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="responsibleDoctor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Médecin Responsable *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du médecin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section Détail des Frais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">Détail des Frais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dialysisFee"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <Label htmlFor="dialysisFee" className="flex-1">Séance de dialyse</Label>
                          <FormControl>
                            <Input
                              id="dialysisFee"
                              type="number"
                              {...field}
                              className="w-[150px] text-right"
                            />
                          </FormControl>
                          <FormMessage className="ml-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="generatorDialyzer"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <Label htmlFor="generatorDialyzer" className="flex-1">Générateur + dialyseur</Label>
                          <FormControl>
                            <Input
                              id="generatorDialyzer"
                              type="number"
                              {...field}
                              className="w-[150px] text-right"
                            />
                          </FormControl>
                          <FormMessage className="ml-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medConsumables"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <Label htmlFor="medConsumables" className="flex-1">Médicaments et consommables</Label>
                          <FormControl>
                            <Input
                              id="medConsumables"
                              type="number"
                              {...field}
                              className="w-[150px] text-right"
                            />
                          </FormControl>
                          <FormMessage className="ml-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nursingCare"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <Label htmlFor="nursingCare" className="flex-1">Soins infirmiers spécialisés</Label>
                          <FormControl>
                            <Input
                              id="nursingCare"
                              type="number"
                              {...field}
                              className="w-[150px] text-right"
                            />
                          </FormControl>
                          <FormMessage className="ml-4" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adminFees"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <Label htmlFor="adminFees" className="flex-1">Frais administratifs</Label>
                          <FormControl>
                            <Input
                              id="adminFees"
                              type="number"
                              {...field}
                              className="w-[150px] text-right"
                            />
                          </FormControl>
                          <FormMessage className="ml-4" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Totals */}
                  <div className="mt-6 space-y-2 border-t pt-4">
                    <div className="flex justify-end items-center space-x-4 font-bold text-lg">
                      <span className="text-gray-700">Sous-total :</span>
                      <span className="text-blue-600">{subTotal.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-end items-center space-x-4 font-bold text-lg">
                      <span className="text-gray-700">
                        Taxe (
                        <FormField
                          control={form.control}
                          name="taxPercentage"
                          render={({ field }) => (
                            <Input
                              type="number"
                              {...field}
                              className="w-20 inline-block text-right"
                            />
                          )}
                        />
                        %) :
                      </span>
                      <span className="text-blue-600">{taxAmount.toFixed(2)} MAD</span>
                    </div>
                    <div className="flex justify-end items-center space-x-4 font-extrabold text-xl border-t pt-2">
                      <span className="text-gray-800">Total à Payer :</span>
                      <span className="text-green-700">{totalToPay.toFixed(2)} MAD</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Mode de Paiement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">Mode de Paiement</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={() => (
                      <FormItem>
                        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                          {['Espèces', 'Chèque', 'Virement', 'CNOPS', 'RAMED', 'Assurance privée'].map((method) => (
                            <FormField
                              key={method}
                              control={form.control}
                              name="paymentMethod"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={method}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(method)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, method])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== method
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {method}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentReference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Référence de paiement</FormLabel>
                        <FormControl>
                          <Input placeholder="Référence (si applicable)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Section Observations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-800">Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Notes ou observations supplémentaires" {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full mt-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isSubmitting ? "Génération de la facture..." : "Générer la Facture"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default TaxeForm;