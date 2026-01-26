import { motion } from "framer-motion";
import { Check, Container, Users, FileText, Eye, Ship, Package, Truck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface StepValidationStatus {
  isValid: boolean;
  hasError: boolean;
  details?: string[]; // Liste des champs manquants ou complétés
}

interface OrdreStepperProps {
  currentStep: number;
  categorie?: string;
  onStepClick?: (step: number) => void;
  stepsValidation?: Record<number, StepValidationStatus>;
}

const steps = [
  { id: 1, name: "Catégorie", icon: Container, description: "Type d'ordre" },
  { id: 2, name: "Client", icon: Users, description: "Sélection client" },
  { id: 3, name: "Détails", icon: FileText, description: "Informations" },
  { id: 4, name: "Récapitulatif", icon: Eye, description: "Vérification" },
];

export function OrdreStepper({ currentStep, categorie, onStepClick, stepsValidation = {} }: OrdreStepperProps) {
  const getCategorieIcon = () => {
    switch (categorie) {
      case "conteneurs":
        return <Container className="h-4 w-4" />;
      case "conventionnel":
        return <Ship className="h-4 w-4" />;
      case "operations_independantes":
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStepStatus = (stepId: number) => {
    const validation = stepsValidation[stepId];
    const isCompleted = currentStep > stepId;
    const isCurrent = currentStep === stepId;
    
    if (validation?.hasError && !isCurrent) {
      return 'error';
    }
    if (isCompleted && (validation?.isValid !== false)) {
      return 'completed';
    }
    if (isCurrent) {
      return 'current';
    }
    return 'pending';
  };

  const getTooltipContent = (stepId: number, status: string) => {
    const validation = stepsValidation[stepId];
    const step = steps.find(s => s.id === stepId);
    
    if (status === 'error' && validation?.details?.length) {
      return (
        <div className="space-y-1">
          <p className="font-medium text-destructive">Champs manquants :</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            {validation.details.map((detail, idx) => (
              <li key={idx}>{detail}</li>
            ))}
          </ul>
        </div>
      );
    }
    
    if (status === 'completed') {
      if (validation?.details?.length) {
        return (
          <div className="space-y-1">
            <p className="font-medium text-green-600">✓ Complété</p>
            <ul className="text-xs space-y-0.5">
              {validation.details.map((detail, idx) => (
                <li key={idx} className="text-muted-foreground">{detail}</li>
              ))}
            </ul>
          </div>
        );
      }
      return <p className="font-medium text-green-600">✓ Étape complétée</p>;
    }
    
    if (status === 'current') {
      return <p>Étape en cours : {step?.description}</p>;
    }
    
    return <p>{step?.description}</p>;
  };

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          const isCurrent = status === 'current';
          const hasError = status === 'error';
          const StepIcon = step.icon;

          return (
            <li key={step.name} className="relative flex-1">
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 bg-muted"
                  aria-hidden="true"
                >
                  <motion.div
                    className={cn(
                      "h-full",
                      hasError ? "bg-destructive" : "bg-primary"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: isCompleted || hasError ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onStepClick?.(step.id)}
                    disabled={step.id > currentStep + 1}
                    className={cn(
                      "group flex flex-col items-center relative z-10",
                      step.id > currentStep + 1 && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <motion.span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-200",
                        hasError
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-background text-muted-foreground"
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={hasError ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 hsl(var(--destructive) / 0)",
                          "0 0 0 8px hsl(var(--destructive) / 0.3)",
                          "0 0 0 0 hsl(var(--destructive) / 0)"
                        ]
                      } : {}}
                      transition={hasError ? {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : { duration: 0.2 }}
                    >
                      {hasError ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : step.id === 1 && categorie ? (
                        getCategorieIcon()
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </motion.span>
                    <span
                      className={cn(
                        "mt-2 text-sm font-medium transition-colors duration-200",
                        hasError
                          ? "text-destructive"
                          : isCurrent
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </span>
                    <span className={cn(
                      "text-xs hidden sm:block",
                      hasError ? "text-destructive/80" : "text-muted-foreground"
                    )}>
                      {hasError ? "À compléter" : step.description}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {getTooltipContent(step.id, status)}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
