"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { markdown } from "@codemirror/lang-markdown";
import { cpp } from "@codemirror/lang-cpp";
import type { Extension } from "@codemirror/state";

function getLanguageExtension(language?: string): Extension {
  switch (language?.toLowerCase()) {
    case "javascript":
    case "jsx":
      return javascript();
    case "typescript":
    case "tsx":
      return javascript({ typescript: true });
    case "css":
      return css();
    case "html":
      return html();
    case "json":
      return json();
    case "python":
      return python();
    case "rust":
      return rust();
    case "sql":
      return sql();
    case "markdown":
      return markdown();
    case "c":
    case "cpp":
      return cpp();
    default:
      return [];
  }
}

interface CodeMirrorEditorProps {
  value: string;
  language?: string;
  onChange: (value: string) => void;
}

export function CodeMirrorEditor({ value, language, onChange }: CodeMirrorEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          oneDark,
          languageCompartment.current.of(getLanguageExtension(language)),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
          EditorView.theme({
            ".cm-scroller": { fontFamily: "ui-monospace, monospace", minHeight: "200px" },
            ".cm-content": { padding: "12px" },
          }),
        ],
      }),
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    viewRef.current.dispatch({
      effects: languageCompartment.current.reconfigure(getLanguageExtension(language)),
    });
  }, [language]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-border text-sm"
    />
  );
}
