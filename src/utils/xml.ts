import { DOMParser } from "xmldom";
import { decode } from "he";

export function xmlExtractor(xml: string) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "application/xml");
  const textElements = xmlDoc.getElementsByTagName("text");
  let transcript = "";
  for (let i = 0; i < textElements.length; i++) {
    transcript += textElements[i].textContent + " ";
  }
  return decode(transcript.trim());
}
