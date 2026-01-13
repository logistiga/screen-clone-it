import { Check, FileText, Package, Calculator, Eye, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface DevisStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  isEditMode?: boolean;
}

const steps: Step[] = [
  { id: 1, title: "Catégorie", description: "Type de devis", icon: <FileText className="h-5 w-5" /> },
  { id: 2, title: "Client", description: "Informations client", icon: <User className="h-5 w-5" /> },
  { id: 3, title: "Détails", description: "Contenus du devis", icon: <Package className="h-5 w-5" /> },
  { id: 4, title: "Récapitulatif", description: "Montants et notes", icon: <Calculator className="h-5 w-5" /> },
  { id: 5, title: "Aperçu", description: "Vérification finale", icon: <Eye className="h-5 w-5" /> },
];

export default function DevisStepper({ currentStep, onStepClick, isEditMode = false }: DevisStepperProps) {
  // En mode édition, on commence à l'étape 2 (pas de sélection de catégorie)
  const displaySteps = isEditMode ? steps.filter(s => s.id !== 1) : steps;
  const adjustedStep = isEditMode ? Math.max(currentStep - 1, 1) : currentStep;

  return (
    <div className="w-full mb-8 animate-fade-in">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full -z-10" />
        
        {/* Progress bar filled */}
        <div 
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 -z-10"
          style={{ 
            width: `${((adjustedStep - 1) / (displaySteps.length - 1)) * 100}%` 
          }}
        />

        {displaySteps.map((step, index) => {
          const stepNumber = isEditMode ? step.id - 1 : step.id;
          const isActive = adjustedStep === (index + 1);
          const isCompleted = adjustedStep > (index + 1);
          const isClickable = onStepClick && (isCompleted || adjustedStep >= index + 1);

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center relative group",
                isClickable && "cursor-pointer"
              )}
              onClick={() => isClickable && onStepClick?.(isEditMode ? index + 2 : index + 1)}
            >
              {/* Step circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                  isCompleted && "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-green-200",
                  isActive && "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/30 ring-4 ring-primary/20 scale-110",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground",
                  isClickable && !isActive && "hover:scale-105 hover:shadow-md"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Step label */}
              <div className="mt-3 text-center">
                <p className={cn(
                  "font-medium text-sm transition-colors",
                  isActive && "text-primary",
                  isCompleted && "text-green-600",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {step.description}
                </p>
              </div>

              {/* Tooltip on hover */}
              <div className={cn(
                "absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10",
                isCompleted ? "bg-green-500 text-white" : isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {isCompleted ? "Complété" : isActive ? "En cours" : "À venir"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
