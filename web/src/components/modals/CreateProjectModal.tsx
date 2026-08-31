"use client";

import { useState } from "react";
import Button from "@/refresh-components/buttons/Button";
import { useProjectsContext } from "@/app/chat/projects/ProjectsContext";
import { useKeyPress } from "@/hooks/useKeyPress";
import * as InputLayouts from "@/layouts/input-layouts";
import { useAppRouter } from "@/hooks/appNavigation";
import { useModal } from "@/refresh-components/contexts/ModalContext";
import { SvgFolderPlus } from "@opal/icons";
import Modal from "@/refresh-components/Modal";
import InputTypeIn from "@/refresh-components/inputs/InputTypeIn";
import { usePopup } from "@/components/admin/connectors/Popup";
import { useTranslations } from "next-intl";

export default function CreateProjectModal() {
  const t = useTranslations("sidebar.project");
  const { createProject } = useProjectsContext();
  const modal = useModal();
  const route = useAppRouter();
  const [projectName, setProjectName] = useState("");
  const { popup, setPopup } = usePopup();

  async function handleSubmit() {
    const name = projectName.trim();
    if (!name) return;

    try {
      const newProject = await createProject(name);
      route({ projectId: newProject.id });
      modal.toggle(false);
    } catch (e) {
      setPopup({
        type: "error",
        message: t("createProjectFailed", { name }),
      });
    }
  }

  useKeyPress(handleSubmit, "Enter");

  return (
    <>
      {popup}

      <Modal open={modal.isOpen} onOpenChange={modal.toggle}>
        <Modal.Content width="sm">
          <Modal.Header
            icon={SvgFolderPlus}
            title={t("createNewProject")}
            description={t("createNewProjectDescription")}
            onClose={() => modal.toggle(false)}
          />
          <Modal.Body>
            <InputLayouts.Vertical title={t("projectName")}>
              <InputTypeIn
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder={t("projectNamePlaceholder")}
                showClearButton
              />
            </InputLayouts.Vertical>
          </Modal.Body>
          <Modal.Footer>
            <Button secondary onClick={() => modal.toggle(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleSubmit}>{t("createProject")}</Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}
