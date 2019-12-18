import { RestrictedAudioPlaybackStats } from '@digabi/exam-engine-core'
import '@digabi/exam-engine-core/dist/main.css'
import { MasteringResult } from '@digabi/exam-engine-mastering'
import Cookie from 'js-cookie'
import React from 'react'
import ReactDOM from 'react-dom'
import indexedDBExamServerAPI from './utils/indexedDBExamServerAPI'

// Load the original source files in local development environment.
// tslint:disable: no-var-requires
const isDev = process.env.NODE_ENV === 'development'
const Attachments = isDev
  ? require('@digabi/exam-engine-core/dist/components/Attachments').default
  : require('@digabi/exam-engine-core').Attachments
const Exam = isDev
  ? require('@digabi/exam-engine-core/dist/components/Exam').default
  : require('@digabi/exam-engine-core').Exam
const parseExam = isDev
  ? require('@digabi/exam-engine-core/dist/parser/parseExam').default
  : require('@digabi/exam-engine-core').parseExam

const { original, results }: { original: string; results: MasteringResult[] } = require(process.env.EXAM_FILENAME!)

function Toolbar({ hvp, languages, children }: { languages: string[]; hvp: string; children: React.ReactNode }) {
  return (
    <>
      <ol className="toolbar">
        {languages.map(language => (
          <ChangeLanguage language={language} key={language} />
        ))}
        <CopyHvp hvp={hvp} />
      </ol>
      {children}
    </>
  )
}

function ChangeLanguage({ language }: { language: string }) {
  const onClick = () => {
    Cookie.set('language', language)
    window.location.reload()
  }
  return (
    <li className="toolbar__item toolbar__item--language">
      <button onClick={onClick}>{language}</button>
    </li>
  )
}

function CopyHvp({ hvp }: { hvp: string }) {
  return (
    <li className="toolbar__item">
      <button onClick={() => navigator.clipboard.writeText(hvp)}>Kopioi HVP</button>
    </li>
  )
}

window.onload = async () => {
  const app = document.getElementById('app')!

  if (!results) {
    const sourceDoc = parseExam(original, false)
    const root = document.importNode(sourceDoc.documentElement, true)
    return app.appendChild(root)
  }

  const languages = results.map(r => r.language)
  const languageCookie = Cookie.get('language')
  const language = languages.find(lang => lang === languageCookie) || languages[0]

  if (language) {
    const { xml, hvp } = results.find(r => r.language === language)!
    const doc = parseExam(xml, false)

    const Root = location.pathname.startsWith('/attachments') ? Attachments : Exam
    const attachmentsURL = '/attachments/'
    const casCountdownDuration = Number(process.env.CAS_COUNTDOWN_DURATION_SECONDS) || undefined
    const resolveAttachment = (filename: string) => '/attachments/' + encodeURIComponent(filename)

    const examUuid = doc.documentElement.getAttribute('exam-uuid')!
    const examServerApi = indexedDBExamServerAPI(examUuid, resolveAttachment)
    const answers = await examServerApi.getAnswers()
    const restrictedAudioPlaybackStats: RestrictedAudioPlaybackStats[] = []

    const scrollKey = Root === Exam ? 'examScrollY' : 'attachmentsScrollY'
    window.addEventListener('beforeunload', () => localStorage.setItem(scrollKey, window.scrollY.toString()))

    document.body.style.backgroundColor = Root === Exam ? '#e0f4fe' : '#f0f0f0'

    ReactDOM.render(
      <Toolbar {...{ languages, selectedLanguage: language, hvp }}>
        <Root
          {...{
            casCountdownDuration,
            doc,
            language,
            attachmentsURL,
            resolveAttachment,
            answers,
            casStatus: 'forbidden',
            restrictedAudioPlaybackStats,
            examServerApi
          }}
        />
      </Toolbar>,
      app,
      () => {
        const maybeScrollY = localStorage.getItem(scrollKey)
        localStorage.removeItem(scrollKey)
        if (maybeScrollY) {
          requestAnimationFrame(() => {
            window.scrollTo(0, Number(maybeScrollY))
          }) // Delay scrolling a bit to wait for the layout to stabilize.
        }
      }
    )
  }
}
