"use strict";

(() => {
  const DEFAULT_TITLE = "Wave Gate";
  const STORAGE_KEY = "tab-studio-settings";
  const DEFAULT_ICON = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#426cf5"/><text x="50%" y="53%" fill="white" font-family="Arial,sans-serif" font-size="40" font-weight="700" text-anchor="middle" dominant-baseline="middle">W</text></svg>'
  )}`;
  const PRESETS = {
    search: {
      title: "Google",
      icon: "https://www.google.com/favicon.ico",
    },
    docs: {
      title: "Google ドキュメント",
      icon: "https://docs.google.com/favicon.ico",
    },
  };

  const settingsForm = document.querySelector("#settings-form");
  const titleInput = document.querySelector("#title-input");
  const iconInput = document.querySelector("#icon-input");
  const settingsStatus = document.querySelector("#settings-status");
  const favicon = document.querySelector("#page-favicon");
  const navigationForm = document.querySelector("#navigation-form");
  const urlInput = document.querySelector("#url-input");
  const navigationStatus = document.querySelector("#navigation-status");
  const openLink = document.querySelector("#open-link");

  function showSettingsStatus(message, kind) {
    settingsStatus.textContent = message;
    if (kind) {
      settingsStatus.dataset.kind = kind;
    } else {
      delete settingsStatus.dataset.kind;
    }
  }

  function validateIcon(value) {
    if (!value) return DEFAULT_ICON;
    if (value.length > 2048) {
      throw new Error("アイコンURLは2048文字以内で入力してください。");
    }

    let parsed;
    try {
      parsed = new URL(value, window.location.href);
    } catch {
      throw new Error("ファビコン画像URLを確認してください。");
    }

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    if (parsed.protocol === "data:" && /^data:image\/(?:png|gif|jpeg|webp|svg\+xml);/i.test(value)) {
      return value;
    }
    throw new Error("ファビコンにはHTTP(S)または画像データURLを指定してください。");
  }

  function applySettings(title, icon) {
    const safeTitle = title.trim() || DEFAULT_TITLE;
    const safeIcon = validateIcon(icon.trim());
    titleInput.value = safeTitle;
    iconInput.value = icon;
    document.title = safeTitle;
    favicon.href = safeIcon;
  }

  function saveSettings(title, icon) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ title, icon }));
    } catch {
      showSettingsStatus("このブラウザでは設定を保存できませんでした。", "error");
      return false;
    }
    return true;
  }

  function commitSettings(title, icon) {
    try {
      applySettings(title, icon);
    } catch (error) {
      showSettingsStatus(error.message, "error");
      return;
    }

    if (saveSettings(titleInput.value, iconInput.value)) {
      showSettingsStatus("設定を保存しました。");
    }
  }

  function restoreSettings() {
    let saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      applySettings(DEFAULT_TITLE, "");
      showSettingsStatus("このブラウザでは設定を読み込めませんでした。", "error");
      return;
    }
    if (!saved) {
      applySettings(DEFAULT_TITLE, "");
      return;
    }

    try {
      const settings = JSON.parse(saved);
      if (
        !settings ||
        typeof settings.title !== "string" ||
        typeof settings.icon !== "string"
      ) {
        throw new Error("保存された設定の形式が正しくありません。");
      }
      applySettings(settings.title, settings.icon);
    } catch (error) {
      applySettings(DEFAULT_TITLE, "");
      showSettingsStatus(`保存済みの設定を読み込めませんでした: ${error.message}`, "error");
    }
  }

  function normalizeUrl(value) {
    const trimmed = value.trim();
    const hasHttpScheme = /^https?:\/\//i.test(trimmed);
    const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
    const hasHostPort = /^(?:\[[^\]]+\]|[^/?#:]+):\d+(?:[/?#]|$)/.test(trimmed);
    if (hasScheme && !hasHttpScheme && !hasHostPort) {
      throw new Error("HTTPまたはHTTPSのURLを入力してください。");
    }

    let parsed;
    try {
      if (hasHttpScheme) {
        parsed = new URL(trimmed);
      } else {
        const probe = new URL(`http://${trimmed}`);
        const host = probe.hostname.toLowerCase();
        const isLocal = host === "localhost" ||
          host.endsWith(".localhost") ||
          host === "127.0.0.1" ||
          host === "[::1]";
        parsed = new URL(`${isLocal ? "http" : "https"}://${trimmed}`);
      }
    } catch {
      throw new Error("有効なURLを入力してください。");
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("HTTPまたはHTTPSのURLを入力してください。");
    }
    return parsed.href;
  }

  function prepareUrl(value) {
    openLink.hidden = true;
    let url;
    try {
      url = normalizeUrl(value);
    } catch (error) {
      navigationStatus.textContent = error.message;
      navigationStatus.dataset.kind = "error";
      urlInput.focus();
      return;
    }

    urlInput.value = url;
    openLink.href = url;
    openLink.hidden = false;
    navigationStatus.textContent = "URLを確認しました。別タブで開くボタンから直接アクセスできます。";
    delete navigationStatus.dataset.kind;
  }

  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    commitSettings(titleInput.value, iconInput.value);
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = PRESETS[button.dataset.preset];
      if (preset) commitSettings(preset.title, preset.icon);
    });
  });

  navigationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    prepareUrl(urlInput.value);
  });

  urlInput.addEventListener("input", () => {
    openLink.hidden = true;
    navigationStatus.textContent = "";
    delete navigationStatus.dataset.kind;
  });

  restoreSettings();
})();
