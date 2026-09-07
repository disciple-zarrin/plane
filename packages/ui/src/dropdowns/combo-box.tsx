/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Combobox } from "@headlessui/react";
import type { ElementType, KeyboardEventHandler, ReactNode, Ref } from "react";
import React, { Fragment, forwardRef, useEffect, useRef, useState } from "react";

type Props = {
  as?: ElementType | undefined;
  ref?: Ref<HTMLElement> | undefined;
  tabIndex?: number | undefined;
  className?: string | undefined;
  value?: string | string[] | null;
  onChange?: (value: any) => void;
  disabled?: boolean | undefined;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement> | undefined;
  multiple?: boolean;
  renderByDefault?: boolean;
  button: ReactNode;
  children: ReactNode;
};

const ComboDropDown = forwardRef(function ComboDropDown(props: Props, ref) {
  const { button, renderByDefault = true, children, ...rest } = props;

  const dropDownButtonRef = useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] = useState(renderByDefault);

  const onTrigger = () => {
    setShouldRender(true);
  };

  useEffect(() => {
    const element = dropDownButtonRef.current as any;

    if (!element) return;

    element.addEventListener("mouseenter", onTrigger);
    element.addEventListener("focusin", onTrigger);
    element.addEventListener("pointerdown", onTrigger);

    return () => {
      element?.removeEventListener("mouseenter", onTrigger);
      element?.removeEventListener("focusin", onTrigger);
      element?.removeEventListener("pointerdown", onTrigger);
    };
  }, [dropDownButtonRef, shouldRender]);

  if (!shouldRender) {
    return (
      <div ref={dropDownButtonRef} className="flex h-full items-center">
        {button}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    <Combobox {...rest} ref={ref}>
      <Combobox.Button as={Fragment}>{button}</Combobox.Button>
      {children}
    </Combobox>
  );
});

ComboDropDown.displayName = "ComboDropDown";

export { ComboDropDown };
