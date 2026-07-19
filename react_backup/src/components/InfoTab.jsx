import { useEffect, useMemo, useState } from 'react';
import { getNoticeItems } from '../data/infoContent.js';
import {
  getMonthCells,
  SCHEDULE_TYPE_LABEL_KEYS,
} from '../lib/campaignSchedule.js';

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const INSTALL_IMAGE_SRC = `${import.meta.env.BASE_URL}img.png`;

function BellIcon() {
  return (
    <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function CalendarIcon({ className = 'info-card-icon' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="info-card-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function NoticeText({ parts }) {
  return parts.map((part, index) => (
    part.strong
      ? <strong key={`${part.text}-${index}`}>{part.text}</strong>
      : <span key={`${part.text}-${index}`}>{part.text}</span>
  ));
}

function InfoCard({ icon, title, children, className = '' }) {
  return (
    <section className={`info-card ${className}`.trim()}>
      <div className="info-card-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NoticeList({ locale }) {
  const notices = getNoticeItems(locale);

  return (
    <ul className="notice-list">
      {notices.map((notice, index) => (
        <li key={`${notice.badge}-${index}`}>
          <span className={`notice-badge badge-${notice.tone}`}>{notice.badge}</span>
          <span><NoticeText parts={notice.parts} /></span>
        </li>
      ))}
    </ul>
  );
}

function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
      setCanInstall(true);
    }

    function handleInstalled() {
      setInstallPrompt(null);
      setCanInstall(false);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  async function triggerInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
    setCanInstall(false);
  }

  return { canInstall, triggerInstall };
}

function ContactCard({ t, locale }) {
  const reportHrefByLocale = {
    ko: 'https://tally.so/r/yPeYr8',
    ja: 'https://tally.so/r/Bz87v5',
    en: 'https://tally.so/r/kdOEL1',
  };
  const reportHref = reportHrefByLocale[locale] ?? reportHrefByLocale.ko;

  return (
    <InfoCard icon={<MailIcon />} title={t('info.contactTitle')} className="contact-card">
      <div className="info-text">
        <p>{t('info.contactText')}</p>
      </div>
      <a className="contact-box" href={reportHref} target="_blank" rel="noreferrer">
        <span className="contact-icon" aria-hidden="true">
          <MailIcon />
        </span>
        <span className="contact-email">{t('info.reportLink')}</span>
      </a>
    </InfoCard>
  );
}

function InstallGuideCard({ t }) {
  const { canInstall, triggerInstall } = useInstallPrompt();

  return (
    <InfoCard icon={<PhoneIcon />} title={t('info.homeTitle')} className="install-card">
      <div className="info-text install-guide">
        <div className="install-block">
          <p className="install-platform"><strong>{t('info.homeAndroid')}</strong></p>
          {canInstall ? (
            <button type="button" className="download-btn" onClick={triggerInstall}>
              {t('info.homeAndroidBtn')}
            </button>
          ) : null}
          <p>{t('info.homeAndroidHint')}</p>
        </div>
        <div className="install-block">
          <p className="install-platform"><strong>{t('info.homeIos')}</strong></p>
          <ol className="install-steps">
            <li>{t('info.homeIosStep1')}</li>
            <li><strong>{t('info.homeIosStep2Strong')}</strong>{t('info.homeIosStep2Rest')}</li>
            <li>{t('info.homeIosStep3')}</li>
          </ol>
        </div>
      </div>
    </InfoCard>
  );
}

function ScheduleDot({ type }) {
  return <span className={`cal-dot cal-dot-${type}`} aria-hidden="true" />;
}

function CampaignCalendarModal({ isOpen, onClose, t }) {
  const today = useMemo(() => new Date(), []);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [visibleDate, setVisibleDate] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleCalendarKeydown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      moveMonth(event.key === 'ArrowLeft' ? -1 : 1);
    }

    document.addEventListener('keydown', handleCalendarKeydown);
    return () => document.removeEventListener('keydown', handleCalendarKeydown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setActiveTooltip(null);
      setVisibleDate({
        year: today.getFullYear(),
        month: today.getMonth(),
      });
    }
  }, [isOpen, today]);

  const cells = useMemo(
    () => getMonthCells(visibleDate.year, visibleDate.month, today),
    [today, visibleDate.month, visibleDate.year],
  );

  function moveMonth(direction) {
    setActiveTooltip(null);
    setVisibleDate((current) => {
      const next = new Date(current.year, current.month + direction, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  if (!isOpen) return null;

  const monthLabel = `${visibleDate.year}.${String(visibleDate.month + 1).padStart(2, '0')}`;

  return (
    <div className="cal-modal open" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="cal-modal-box" role="dialog" aria-modal="true" aria-label={t('calendar.title')}>
        <div className="cal-hd">
          <div className="cal-month-lbl">{monthLabel}</div>
          <div className="cal-nav-btns">
            <button type="button" onClick={() => moveMonth(-1)} aria-label={t('calendar.prevMonth')} aria-keyshortcuts="ArrowLeft">‹</button>
            <button type="button" onClick={() => moveMonth(1)} aria-label={t('calendar.nextMonth')} aria-keyshortcuts="ArrowRight">›</button>
          </div>
        </div>

        <div className="cal-grid">
          {WEEKDAY_LABELS.map((day, index) => (
            <div key={day} className={`cal-dow${index === 0 ? ' sun' : ''}${index === 6 ? ' sat' : ''}`}>
              {day}
            </div>
          ))}
          {cells.map((cell, index) => {
            if (cell.kind === 'empty') {
              return <div key={`empty-${index}`} className="cal-cell empty" />;
            }

            const eventLabel = cell.events.map((event) => t(SCHEDULE_TYPE_LABEL_KEYS[event.type])).join('\n');
            const tooltipKey = `${visibleDate.year}-${visibleDate.month}-${cell.day}`;
            const hasEvents = cell.events.length > 0;
            const showTooltip = hasEvents && activeTooltip === tooltipKey;

            return (
              <div
                key={cell.day}
                className={`cal-cell${cell.dow === 0 ? ' sun' : ''}${cell.dow === 6 ? ' sat' : ''}${cell.isToday ? ' today' : ''}${hasEvents ? ' has-events' : ''}${showTooltip ? ' tooltip-open' : ''}`}
                onMouseEnter={() => hasEvents && setActiveTooltip(tooltipKey)}
                onMouseLeave={() => hasEvents && setActiveTooltip(null)}
                onFocus={() => hasEvents && setActiveTooltip(tooltipKey)}
                onBlur={() => hasEvents && setActiveTooltip(null)}
                tabIndex={hasEvents ? 0 : undefined}
                aria-label={eventLabel || undefined}
              >
                <span className="cal-day-num">{cell.day}</span>
                {cell.events.length > 0 ? (
                  <span className="cal-dots">
                    {cell.events.map((event) => (
                      <ScheduleDot key={`${cell.day}-${event.type}`} type={event.type} />
                    ))}
                  </span>
                ) : null}
                {showTooltip ? <span className="cal-tooltip">{eventLabel}</span> : null}
              </div>
            );
          })}
        </div>

        <div className="cal-legend">
          <div className="cal-legend-top">
            <span className="cal-legend-item"><span className="cal-legend-dot cal-dot-scoutA-start" />{t('calendar.scoutA')}</span>
            <span className="cal-legend-item"><span className="cal-legend-dot cal-dot-scoutB-start" />{t('calendar.scoutB')}</span>
            <span className="cal-legend-item"><span className="cal-legend-dot cal-dot-event-start" />{t('calendar.event')}</span>
          </div>
          <div className="cal-legend-rule">
            <span className="cal-rule-dot cal-dot-scoutA-pre" />{t('calendar.legendPre')}
            <span className="cal-rule-dot cal-dot-scoutA-start" />{t('calendar.legendStart')}
          </div>
        </div>
      </section>
    </div>
  );
}

function ScheduleCard({ t }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <InfoCard icon={<CalendarIcon />} title={t('calendar.cardTitle')} className="schedule-card">
        <button type="button" className="cal-open-btn" onClick={() => setIsOpen(true)}>
          <CalendarIcon className="cal-open-icon" />
          <span>{t('calendar.open')}</span>
        </button>
      </InfoCard>
      <CampaignCalendarModal isOpen={isOpen} onClose={() => setIsOpen(false)} t={t} />
    </>
  );
}

export function InfoTab({ locale, t }) {
  return (
    <section className="info-tab" aria-label={t('tabs.info')}>
      <div className="info-grid">
        <InfoCard icon={<BellIcon />} title={t('info.noticeTitle')}>
          <NoticeList locale={locale} />
        </InfoCard>

        <ContactCard t={t} locale={locale} />
        <ScheduleCard t={t} />
        <InstallGuideCard t={t} />
      </div>

      <div className="info-image-card">
        <img src={INSTALL_IMAGE_SRC} alt="" loading="lazy" />
      </div>
    </section>
  );
}
