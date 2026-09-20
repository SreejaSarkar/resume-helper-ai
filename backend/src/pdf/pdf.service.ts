import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generateFromStructuredData(
    resume: {
      personalInfo: {
        name: string;
        contact: string;
      };
      optimizedResume: {
        summary: string;
        experience: { original: string; optimized: string }[];
        skills: string[];
        education: string[];
        certifications: string[];
      };
    },
    outputPath: string,
  ) {
    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  /* Base styling */
  body {
    font-family: Arial, Helvetica, sans-serif;
    margin: 20px;
    color: #111;
    line-height: 1.3;
    font-size: 11pt;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 10px;
  }
  .header h1 {
    margin: 0;
    font-size: 20pt;
  }
  .header p {
    margin: 2px 0;
    font-size: 10pt;
    color: #555;
  }

  /* Section headings */
  h2 {
    font-size: 12pt;
    border-bottom: 1px solid #ccc;
    padding-bottom: 2px;
    margin: 10px 0 5px;
  }

  /* Lists */
  ul {
    margin: 0;
    padding-left: 15px;
  }
  li {
    margin-bottom: 3px;
  }

  /* Two-column layout for skills, education, certifications */
  .columns {
    display: flex;
    gap: 20px;
  }
  .column {
    flex: 1;
  }

  /* Make summary a bit tighter */
  .summary {
    margin-bottom: 8px;
  }

</style>
</head>
<body>

  <!-- Header with name & contact -->
  <div class="header">
    <h1>${resume.personalInfo.name}</h1>
    <p>${resume.personalInfo.contact}</p>
  </div>

  <!-- Summary -->
  <h2>Summary</h2>
  <p class="summary">${resume.optimizedResume.summary}</p>

  <!-- Experience -->
  <h2>Experience</h2>
  <ul>
    ${resume.optimizedResume.experience
      .map((e) => `<li>${e.optimized}</li>`)
      .join('')}
  </ul>

  <!-- Skills, Education, Certifications in two columns -->
  <div class="columns">

    <div class="column">
      ${
        resume.optimizedResume.skills.length
          ? `
        <h2>Skills</h2>
        <ul>
          ${resume.optimizedResume.skills.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      `
          : ''
      }
    </div>

    <div class="column">
      ${
        resume.optimizedResume.education.length
          ? `
        <h2>Education</h2>
        <ul>
          ${resume.optimizedResume.education.map((e) => `<li>${e}</li>`).join('')}
        </ul>
      `
          : ''
      }

      ${
        resume.optimizedResume.certifications.length
          ? `
        <h2>Certifications</h2>
        <ul>
          ${resume.optimizedResume.certifications.map((c) => `<li>${c}</li>`).join('')}
        </ul>
      `
          : ''
      }
    </div>

  </div>

</body>
</html>
`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const height = await page.evaluate(() => document.body.scrollHeight);

    if (height > 1120) {
      await page.addStyleTag({
        content: `body { font-size: 10.5pt; }`,
      });
    }

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '15mm', right: '15mm' },
    });

    await browser.close();
  }
}
