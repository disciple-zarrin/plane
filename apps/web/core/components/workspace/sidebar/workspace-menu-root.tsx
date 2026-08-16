/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePopper } from "react-popper";
import { observer } from "mobx-react";
import Link from "next/link";
// icons
import { CirclePlus, LogOut, Mails } from "lucide-react";
// ui
import { Menu, Transition } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspace } from "@plane/types";
import { Loader } from "@plane/ui";
import { orderWorkspacesList, cn } from "@plane/utils";
// helpers
import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserProfile } from "@/hooks/store/user";
import { useInstance } from "@/hooks/store/use-instance";
// components
import { WorkspaceLogo } from "../logo";
import SidebarDropdownItem from "./dropdown-item";

type WorkspaceMenuRootProps = {
  variant: "sidebar" | "top-navigation";
};

export const WorkspaceMenuRoot = observer(function WorkspaceMenuRoot(props: WorkspaceMenuRootProps) {
  const { variant } = props;
  // store hooks
  const { toggleSidebar, toggleAnySidebarDropdown } = useAppTheme();
  const { config } = useInstance();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  const { updateUserProfile } = useUserProfile();
  const { currentWorkspace: activeWorkspace, workspaces } = useWorkspace();
  // derived values
  const isWorkspaceCreationDisabled = config?.is_workspace_creation_disabled ?? false;
  // translation
  const { t } = useTranslation();
  // local state
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  // Anchor panel under the trigger. In RTL top-nav the trigger sits on the right,
  // so bottom-end keeps the menu aligned to that edge instead of jumping left.
  const isRtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const placement =
    variant === "top-navigation" ? (isRtl ? "bottom-end" : "bottom-start") : isRtl ? "bottom-end" : "bottom-start";

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    strategy: "fixed",
    modifiers: [
      { name: "offset", options: { offset: [0, 4] } },
      { name: "preventOverflow", options: { padding: 8 } },
      { name: "flip", options: { fallbackPlacements: ["bottom-start", "bottom-end", "top-end", "top-start"] } },
    ],
  });

  const handleWorkspaceNavigation = (workspace: IWorkspace) => updateUserProfile({ last_workspace_id: workspace?.id });

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("auth.sign_out.toast.error.title"),
        message: t("auth.sign_out.toast.error.message"),
      })
    );
  };

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };
  const workspacesList = orderWorkspacesList(Object.values(workspaces ?? {}));

  useEffect(() => {
    toggleAnySidebarDropdown(isWorkspaceMenuOpen);
  }, [isWorkspaceMenuOpen, toggleAnySidebarDropdown]);

  const panel = (close: () => void) => (
    <div
      ref={setPopperElement}
      style={styles.popper}
      {...attributes.popper}
      className="z-[40] flex w-[19rem] max-w-[min(19rem,calc(100vw-1rem))] flex-col divide-y divide-subtle rounded-md border-[0.5px] border-strong bg-surface-1 text-start shadow-raised-200 outline-none"
    >
      <div className="vertical-scrollbar flex scrollbar-sm max-h-96 flex-col items-start justify-start overflow-x-hidden overflow-y-scroll">
        <span className="sticky top-0 z-21 h-full w-full flex-shrink-0 truncate rounded-md bg-surface-1 px-4 pt-3 pb-1 text-start text-13 font-medium text-placeholder">
          {currentUser?.email}
        </span>
        {workspacesList ? (
          <div className="flex size-full flex-col items-start justify-start">
            {(activeWorkspace
              ? [activeWorkspace, ...workspacesList.filter((workspace) => workspace.id !== activeWorkspace?.id)]
              : workspacesList
            ).map((workspace) => (
              <SidebarDropdownItem
                key={workspace.id}
                workspace={workspace}
                activeWorkspace={activeWorkspace}
                handleItemClick={handleItemClick}
                handleWorkspaceNavigation={handleWorkspaceNavigation}
                handleClose={close}
              />
            ))}
          </div>
        ) : (
          <div className="w-full">
            <Loader className="space-y-2">
              <Loader.Item height="30px" />
              <Loader.Item height="30px" />
            </Loader>
          </div>
        )}
      </div>
      <div className="flex w-full flex-col items-start justify-start gap-2 px-4 py-2 text-13">
        {!isWorkspaceCreationDisabled && (
          <Link href="/create-workspace" className="w-full">
            <Menu.Item
              as="div"
              className="flex items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-secondary hover:bg-layer-transparent-hover"
            >
              <CirclePlus className="size-4 flex-shrink-0" />
              {t("create_workspace")}
            </Menu.Item>
          </Link>
        )}

        <Link href="/invitations" className="w-full" onClick={handleItemClick}>
          <Menu.Item
            as="div"
            className="flex items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-secondary hover:bg-layer-transparent-hover"
          >
            <Mails className="h-4 w-4 flex-shrink-0" />
            {t("workspace_invites")}
          </Menu.Item>
        </Link>

        <div className="w-full">
          <Menu.Item
            as="button"
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-13 font-medium text-danger-primary hover:bg-layer-transparent-hover"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 flex-shrink-0" />
            {t("sign_out")}
          </Menu.Item>
        </div>
      </div>
    </div>
  );

  return (
    <Menu
      as="div"
      className={cn("relative flex h-full w-fit max-w-48 whitespace-nowrap", {
        "w-full justify-center text-center": variant === "sidebar",
        "text-start": variant === "top-navigation",
      })}
    >
      {({ open, close }: { open: boolean; close: () => void }) => {
        if (isWorkspaceMenuOpen !== open) {
          setIsWorkspaceMenuOpen(open);
        }

        return (
          <>
            {variant === "sidebar" && (
              <Menu.Button
                ref={setReferenceElement}
                className={cn("flex size-8 w-full items-center justify-center rounded-md", {
                  "bg-layer-1": open,
                })}
              >
                <AppSidebarItem
                  variant="button"
                  item={{
                    icon: (
                      <WorkspaceLogo
                        logo={activeWorkspace?.logo_url}
                        name={activeWorkspace?.name}
                        classNames="size-8 rounded-md border border-subtle"
                      />
                    ),
                  }}
                />
              </Menu.Button>
            )}
            {variant === "top-navigation" && (
              <Menu.Button
                ref={setReferenceElement}
                className={cn(
                  "group/menu-button flex max-w-48 items-center justify-between gap-1 truncate rounded-sm p-1 text-13 font-medium text-secondary hover:bg-layer-1 focus:outline-none",
                  {
                    "bg-layer-1": open,
                  }
                )}
                aria-label={t("aria_labels.projects_sidebar.open_workspace_switcher")}
              >
                <div className="flex min-w-0 items-center gap-2 truncate">
                  <WorkspaceLogo
                    logo={activeWorkspace?.logo_url}
                    name={activeWorkspace?.name}
                    classNames="border border-subtle rounded-md size-7"
                  />
                  <h4 className="truncate text-14 font-medium text-primary">{activeWorkspace?.name ?? t("loading")}</h4>
                </div>
                <ChevronDownIcon
                  className={cn("size-4 flex-shrink-0 text-placeholder duration-300", {
                    "rotate-180": open,
                  })}
                />
              </Menu.Button>
            )}
            {typeof document !== "undefined" &&
              createPortal(
                <Transition
                  show={open}
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items static as={Fragment}>
                    {panel(close)}
                  </Menu.Items>
                </Transition>,
                document.body
              )}
          </>
        );
      }}
    </Menu>
  );
});
