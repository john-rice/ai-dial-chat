import { memo, useCallback, useMemo } from 'react';

import classNames from 'classnames';

import { useTranslation } from '@/src/hooks/useTranslation';

import {
  getConfigurationSchema,
  getFormButtonType,
  getMessageSchema,
  isFormSchemaValid,
} from '@/src/utils/app/form-schema';

import { FormButtonType } from '@/src/types/chat';
import { Translation } from '@/src/types/translation';

import { FormSchema } from '@/src/components/Chat/ChatMessage/MessageSchema/FormSchema';
import { ErrorMessage } from '@/src/components/Common/ErrorMessage';

import {
  DialSchemaProperties,
  Message,
  MessageFormSchema,
  MessageFormValue,
  MessageFormValueType,
} from '@epam/ai-dial-shared';

interface UserSchemaProps {
  messageIndex: number;
  allMessages: Message[];
  isEditing: boolean;
  setInputValue?: (v: string) => void;
  formValue?: MessageFormValue;
  setFormValue?: (value: MessageFormValue) => void;
  onSubmit?: (formValue?: MessageFormValue, content?: string) => void;
  disabled?: boolean;
  schema?: MessageFormSchema;
}

const UserSchemaView = memo(function UserSchemaView({
  isEditing,
  setInputValue,
  formValue,
  setFormValue,
  onSubmit,
  disabled,
  schema,
}: UserSchemaProps) {
  const { t } = useTranslation(Translation.Chat);

  const handleChange = useCallback(
    (property: string, value: MessageFormValueType, submit?: boolean) => {
      if (schema && formValue) {
        const populateText = schema.properties[property]?.oneOf?.find(
          (option) => option.const === value,
        )?.[DialSchemaProperties.DialWidgetOptions]?.populateText;

        setFormValue?.({ ...formValue, [property]: value });

        if (populateText) setInputValue?.(populateText);
        if (submit)
          onSubmit?.({ ...formValue, [property]: value }, populateText);
      }
    },
    [formValue, onSubmit, schema, setFormValue, setInputValue],
  );

  const userForm = useMemo(() => {
    if (!formValue || !schema) return [];

    return Object.entries(schema.properties)
      .map(([key, property]) => ({
        property: key,
        description: property.description,
        options: property.oneOf,
      }))
      .filter(
        ({ options }) =>
          !!options?.some(
            (option) => getFormButtonType(option) === FormButtonType.Submit,
          ),
      );
  }, [formValue, schema]);

  if (!schema && formValue)
    return <ErrorMessage error={t('Form schema is missing')} />;

  if (!formValue || !schema) return null;

  if (isEditing)
    return (
      <FormSchema
        schema={schema}
        onChange={handleChange}
        formValue={formValue}
        showSelected
        disabled={disabled}
      />
    );

  return userForm.length ? (
    <div className="flex flex-wrap items-center gap-2">
      {userForm.map((row) => (
        <div key={row.property}>
          {!!row.description && (
            <p className="mb-3 text-base text-primary">{row.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {row.options?.map((option) => (
              <button
                key={option.const}
                className={classNames(
                  'chat-button',
                  formValue[row.property] === option.const &&
                    'button-accent-primary',
                )}
                disabled
              >
                {option.title}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  ) : null;
});

export const UserSchema = memo(function UserSchema(props: UserSchemaProps) {
  const { t } = useTranslation(Translation.Chat);

  const schema = useMemo(() => {
    if (props.messageIndex === 0)
      return getConfigurationSchema(props.allMessages[0]);
    return getMessageSchema(props.allMessages[props.messageIndex - 1]);
  }, [props.allMessages, props.messageIndex]);

  if (schema && !isFormSchemaValid(schema))
    return (
      <div className="mt-2">
        <ErrorMessage error={t('Form schema is invalid')} />
      </div>
    );

  return <UserSchemaView {...props} schema={schema} />;
});
