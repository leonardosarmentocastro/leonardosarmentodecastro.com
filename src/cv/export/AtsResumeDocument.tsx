import {
  Document,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { AtsResume } from "./ats-view-model";

const styles = StyleSheet.create({
  page: {
    paddingVertical: 40,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#222222",
    lineHeight: 1.4,
  },
  name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  headline: { fontSize: 11, marginTop: 2 },
  contact: { fontSize: 9, color: "#444444", marginTop: 4 },
  link: { fontSize: 9, color: "#444444" },
  heading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  skillLine: { marginBottom: 2 },
  jobHeader: { fontFamily: "Helvetica-Bold" },
  jobMeta: { fontSize: 9, color: "#555555", marginBottom: 3 },
  bullet: { marginLeft: 10, marginBottom: 2 },
});

export function AtsResumeDocument({ resume }: { resume: AtsResume }) {
  return (
    <Document title={`${resume.name} — Resume`} author={resume.name}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.name}>{resume.name}</Text>
        <Text style={styles.headline}>{resume.headline}</Text>
        <Text style={styles.contact}>{resume.contact}</Text>
        {resume.links.map((link) => (
          <Text key={link} style={styles.link}>
            {link}
          </Text>
        ))}

        <Text style={styles.heading}>Summary</Text>
        <Text>{resume.summary}</Text>

        <Text style={styles.heading}>Skills</Text>
        {resume.skills.map((group) => (
          <Text key={group.category} style={styles.skillLine}>
            {group.category}: {group.entries.join(", ")}
          </Text>
        ))}

        <Text style={styles.heading}>Experience</Text>
        {resume.experience.map((job) => (
          <View key={`${job.company}-${job.dateRange}`} wrap={false}>
            <Text style={styles.jobHeader}>
              {job.role} — {job.company}
            </Text>
            <Text style={styles.jobMeta}>
              {job.dateRange} · {job.location}
            </Text>
            {job.bullets.map((bullet) => (
              <Text key={bullet} style={styles.bullet}>
                • {bullet}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.heading}>Education</Text>
        {resume.education.map((edu) => (
          <View key={edu.school}>
            <Text style={styles.jobHeader}>{edu.degree}</Text>
            <Text style={styles.jobMeta}>
              {edu.school} · {edu.period}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function renderAtsPdf(resume: AtsResume): Promise<Buffer> {
  return renderToBuffer(<AtsResumeDocument resume={resume} />);
}
