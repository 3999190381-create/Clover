import { useFormContext } from "@/components/context/FormContext";
import Button from "@/refresh-components/buttons/Button";
import { SvgArrowLeft, SvgArrowRight, SvgPlusCircle } from "@opal/icons";
import { useLanguage } from "@/hooks/useLanguage";
import { connectorText } from "@/lib/connectorI18n";

const NavigationRow = ({
  noAdvanced,
  noCredentials,
  activatedCredential,
  onSubmit,
  isValid,
}: {
  isValid: boolean;
  onSubmit: () => void;
  noAdvanced: boolean;
  noCredentials: boolean;
  activatedCredential: boolean;
}) => {
  const { formStep, prevFormStep, nextFormStep } = useFormContext();
  const { language } = useLanguage();

  return (
    <div className="mt-4 w-full grid grid-cols-3">
      <div>
        {((formStep > 0 && !noCredentials) ||
          (formStep > 1 && !noAdvanced)) && (
          <Button secondary onClick={prevFormStep} leftIcon={SvgArrowLeft}>
            {connectorText("Previous", language)}
          </Button>
        )}
      </div>
      <div className="flex justify-center">
        {(formStep > 0 || noCredentials) && (
          <Button
            disabled={!isValid}
            rightIcon={SvgPlusCircle}
            onClick={onSubmit}
          >
            {connectorText("Create Connector", language)}
          </Button>
        )}
      </div>
      <div className="flex justify-end">
        {formStep === 0 && (
          <Button
            action
            disabled={!activatedCredential}
            rightIcon={SvgArrowRight}
            onClick={() => nextFormStep()}
          >
            {connectorText("Continue", language)}
          </Button>
        )}
        {!noAdvanced && formStep === 1 && (
          <Button
            secondary
            disabled={!isValid}
            rightIcon={SvgArrowRight}
            onClick={() => nextFormStep()}
          >
            {connectorText("Advanced", language)}
          </Button>
        )}
      </div>
    </div>
  );
};
export default NavigationRow;
