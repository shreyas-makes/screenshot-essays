import { type App, type FrontMatterCache, Notice, TFile } from 'obsidian';
import React, { useState, useRef, type FC, useEffect, useCallback } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { isCopiable } from 'src/imageFormatTester';
import { copy, save } from '../../utils/capture';
import L from '../../L';
import Target from '../common/Target';
import FormItems from '../common/form/FormItems';


const formSchema: FormSchema<ISettings> = [
  {
    label: L.includingFilename(),
    path: 'showFilename',
    type: 'boolean',
  },
  {
    label: L.imageWidth(),
    path: 'width',
    type: 'number',
  },
  {
    label: L.setting.userInfo.show(),
    path: 'authorInfo.show',
    type: 'boolean',
  },
  {
    label: L.setting.userInfo.name(),
    path: 'authorInfo.name',
    type: 'string',
    when: {flag: true, path: 'authorInfo.show'},
  },
  {
    label: L.setting.userInfo.remark(),
    path: 'authorInfo.remark',
    type: 'string',
    when: {flag: true, path: 'authorInfo.show'},
  },
  {
    label: L.setting.userInfo.avatar.title(),
    desc: L.setting.userInfo.avatar.description(),
    path: 'authorInfo.avatar',
    type: 'file',
    when: {flag: true, path: 'authorInfo.show'},
  },
  {
    label: L.setting.userInfo.align(),
    path: 'authorInfo.align',
    type: 'select',
    options: [
      {text: 'Left', value: 'left'},
      {text: 'Center', value: 'center'},
      {text: 'Right', value: 'right'},
    ],
    when: {flag: true, path: 'authorInfo.show'},
  },
  {
    label: L.setting.userInfo.position(),
    path: 'authorInfo.position',
    type: 'select',
    options: [
      {text: 'Top', value: 'top'},
      {text: 'Bottom', value: 'bottom'},
    ],
    when: {flag: true, path: 'authorInfo.show'},
  },
  {
    label: L.setting.watermark.enable.label(),
    path: 'watermark.enable',
    type: 'boolean',
  },
  {
    label: L.setting.watermark.type.label(),
    path: 'watermark.type',
    type: 'select',
    options: [
      {text: L.setting.watermark.type.text(), value: 'text'},
      {text: L.setting.watermark.type.image(), value: 'image'},
    ],
    when: {flag: true, path: 'watermark.enable'},
  },
  {
    label: L.setting.watermark.text.content(),
    path: 'watermark.text.content',
    type: 'string',
    when: settings =>
      settings.watermark.enable && settings.watermark.type === 'text',
  },
  {
    label: L.setting.watermark.image.src.label(),
    path: 'watermark.image.src',
    type: 'file',
    when: settings =>
      settings.watermark.enable && settings.watermark.type === 'image',
  },
  {
    label: L.setting.watermark.opacity(),
    path: 'watermark.opacity',
    type: 'number',
    when: {flag: true, path: 'watermark.enable'},
  },
  {
    label: L.setting.watermark.rotate(),
    path: 'watermark.rotate',
    type: 'number',
    when: {flag: true, path: 'watermark.enable'},
  },
  {
    label: L.setting.watermark.width(),
    path: 'watermark.width',
    type: 'number',
    when: {flag: true, path: 'watermark.enable'},
  },
  {
    label: L.setting.watermark.height(),
    path: 'watermark.height',
    type: 'number',
    when: {flag: true, path: 'watermark.enable'},
  },
];

const ModalContent: FC<{
  markdownEl: HTMLElement;
  settings: ISettings;
  app: App;
  frontmatter: FrontMatterCache | undefined;
  title: string;
  metadataMap: Record<string, { type: MetadataType }>;
}> = ({ markdownEl, settings, app, frontmatter, title, metadataMap }) => {
  const [formData, setFormData] = useState<ISettings>(settings);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const previewOutRef = useRef<HTMLDivElement>(null);
  const mainHeight = Math.min(764, (window.innerHeight * 0.85) - 225);
  const [processing, setProcessing] = useState(false);
  const [allowCopy, setAllowCopy] = useState(true);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  useEffect(() => {
    isCopiable(formData.format).then(result => {
      setAllowCopy(Boolean(result));
    });
  }, [formData.format]);

  const handleSave = useCallback(async () => {
    if ((formData.width || 640) <= 20) {
      new Notice(L.invalidWidth());
      return;
    }

    setProcessing(true);
    try {
      await save(
        app,
        markdownEl as unknown as TFile,
        title,
        formData['2x'],
        formData.format,
        app.isMobile as boolean,
      );
    } catch {
      new Notice(L.saveFail());
    }

    setProcessing(false);
  }, [markdownEl, formData['2x'], formData.format, title, formData.width]);

  const handleCopy = useCallback(async () => {
    if ((formData.width || 640) <= 20) {
      new Notice(L.invalidWidth());
      return;
    }

    setProcessing(true);
    try {
      const exportImageRoot = markdownEl.querySelector('.export-image-root') as HTMLElement;
      if (exportImageRoot) {
        await copy(exportImageRoot, formData['2x'], formData.format);
      } else {
        new Notice(L.copyFail());
      }
    } catch {
      new Notice(L.copyFail());
    }

    setProcessing(false);
  }, [markdownEl, formData['2x'], formData.format, title, formData.width]);

  return (
    <div className='export-image-preview-root'>
      <div className='export-image-preview-main'>
        <div className='export-image-preview-left'>
          <FormItems
            formSchema={formSchema}
            update={setFormData}
            settings={formData}
            app={app}
          />
          <div className='info-text'>{L.moreSetting()}</div>
        </div>
        <div className='export-image-preview-right'>
          <div ref={previewOutRef} style={{ height: mainHeight }}>
            <TransformWrapper>
              <TransformComponent>
                <Target
                  markdownEl={markdownEl}
                  frontmatter={frontmatter}
                  setting={formData}
                  title={title}
                  metadataMap={metadataMap}
                  app={app}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>
          <div className='info-text'>{L.guide()}</div>
        </div>
      </div>
      <div className='export-image-preview-actions'>
        <div>
        <button onClick={handleSave} disabled={processing}>
        {L.save()}
        </button>
          {allowCopy || <p>{L.notAllowCopy({ format: formData.format.replace(/\d$/, '').toUpperCase() })}</p>}
        </div>
        <button onClick={handleSave} disabled={processing}>
          {L.save()}
        </button>
      </div>
    </div>
  );
};

export default ModalContent;