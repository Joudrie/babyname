import { APP_NAME } from '../config';

const UPDATED = 'October 14, 2026';
const REPO = 'https://github.com/Joudrie/babyname';

export function PrivacyPage() {
  return (
    <article className="legal">
      <p className="panel-note">Last updated {UPDATED}</p>
      <p>
        {APP_NAME} is a free tool for finding a baby name. We built it to collect as little as possible. This page explains what that means in plain
        words.
      </p>

      <h2>What stays on your phone</h2>
      <p>
        Everything you do in {APP_NAME} (the names you swipe, your boxes, rankings, settings, your last name if you enter it) is saved only in your
        browser on this device. We don't have accounts yet, and we don't run a server that receives your names. If you clear your browser data or switch
        phones, that information is gone, and we can't recover it for you.
      </p>

      <h2>Sharing with a partner</h2>
      <p>
        When you tap "Share my list", your kept names, their rankings and the first name you typed are packed into the link itself. Whoever you send
        the link to can see them. The list travels inside the link, not through us.
      </p>

      <h2>Things your browser downloads from others</h2>
      <ul>
        <li>The site is hosted on GitHub Pages, which, like any web host, sees your IP address when you load the page.</li>
        <li>Our fonts come from Google Fonts, so Google sees a request from your browser when the page loads.</li>
        <li>"Hear it" uses your phone's own voice; nothing is sent anywhere.</li>
      </ul>

      <h2>Ads</h2>
      <p>
        Right now the only ads are for our own projects. They don't use cookies or track you; tapping one simply opens that website. If we add an
        outside ad network later, it may use cookies to show and measure ads. We'll update this page and ask for your consent first where the law
        requires it.
      </p>

      <h2>Email</h2>
      <p>We don't collect email addresses today. If we add sign-in later, we'll only use your email to save your progress or send something you asked for. We will never send promotional email.</p>

      <h2>Children</h2>
      <p>{APP_NAME} is made for parents and parents-to-be, not for children, and it doesn't knowingly collect information from anyone.</p>

      <h2>Changes and contact</h2>
      <p>
        If this policy changes, we'll update the date at the top. Questions? Reach us through the project page:{' '}
        <a href={REPO} target="_blank" rel="noopener">
          {REPO.replace('https://', '')}
        </a>
        .
      </p>
    </article>
  );
}

export function TermsPage() {
  return (
    <article className="legal">
      <p className="panel-note">Last updated {UPDATED}</p>
      <p>By using {APP_NAME} you agree to these simple terms.</p>

      <h2>Use it freely</h2>
      <p>{APP_NAME} is free to use for finding names for your family, your stories or anything else. Please don't use it to break the law or to attack the site.</p>

      <h2>About the name information</h2>
      <p>
        Popularity numbers come from official government statistics (the US Social Security Administration, England &amp; Wales ONS, Ireland CSO,
        France INSEE, Spain INE and Norway SSB). Meanings, origins, pronunciations and other versions come from open-source collections and are a guide,
        not gospel. Some may be wrong. Please double-check anything that matters to you before you name a child.
      </p>

      <h2>No guarantees</h2>
      <p>
        {APP_NAME} is provided as it is. We do our best to keep it working, but we can't promise it will always be available or error-free, and your
        saved names live on your device, not with us. To the extent the law allows, we aren't liable for losses from using it.
      </p>

      <h2>Credits</h2>
      <p>
        Name data: US Social Security Administration via the MIT-licensed usbabynames project; nicknames from the Apache-2.0 nicknames list by Old Dominion
        University; official statistics from the agencies above.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; the date at the top shows the latest version.</p>
    </article>
  );
}
