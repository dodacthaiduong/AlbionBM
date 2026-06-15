'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
  }

  return (
    <div className={styles.body}>
      <div className={styles.login}>
        <form
          name="loginform"
          id="loginform"
          action="#"
          method="post"
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <p className={styles.field}>
            <label htmlFor="user_login" className={styles.label}>
              Tên người dùng hoặc địa chỉ email
            </label>
            <input
              type="text"
              name="log"
              id="user_login"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              size={20}
              autoCapitalize="off"
              autoComplete="username"
              required
            />
          </p>

          <p className={styles.field}>
            <label htmlFor="user_pass" className={styles.label}>
              Mật khẩu
            </label>
            <span className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="pwd"
                id="user_pass"
                className={`${styles.input} ${styles.passwordInput}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size={20}
                autoComplete="current-password"
                spellCheck={false}
                required
              />
              <button
                type="button"
                className={styles.eyeToggle}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </span>
          </p>

          <p className={styles.rememberRow}>
            <label className={styles.rememberLabel}>
              <input
                name="rememberme"
                type="checkbox"
                id="rememberme"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={styles.checkbox}
                value="forever"
              />
              Tự động đăng nhập
            </label>
          </p>

          <p className={styles.submitRow}>
            <input
              type="submit"
              name="wp-submit"
              id="wp-submit"
              className={styles.buttonPrimary}
              value="Đăng nhập"
            />
            <input type="hidden" name="redirect_to" value="" />
          </p>
        </form>

        <p id="nav" className={styles.nav}>
          <Link href="#">Bạn quên mật khẩu?</Link>
        </p>
        <p id="backtoblog" className={styles.nav}>
          <Link href="/">&larr; Quay lại Forco Travel &amp; Event</Link>
        </p>

        <div className={styles.languageSwitcher}>
          <span className={styles.globe} aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </span>
          <form action="#" method="post" className={styles.languageForm}>
            <label htmlFor="language" className={styles.srOnly}>
              Ngôn ngữ
            </label>
            <select name="language" id="language" className={styles.select} defaultValue="vi">
              <option value="vi">Tiếng Việt</option>
              <option value="en_US">English (United States)</option>
            </select>
            <button type="submit" className={styles.buttonSmall}>
              Thay đổi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
