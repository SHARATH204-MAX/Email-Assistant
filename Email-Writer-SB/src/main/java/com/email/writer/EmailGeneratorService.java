package com.email.writer;

import com.email.writer.app.EmailRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;

@Service
public class EmailGeneratorService {

    private final WebClient webClient;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=}")
    private String geminiApiUrl;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    public EmailGeneratorService() {
        this.webClient = WebClient.builder().build();
    }

    public boolean hasApiKeyConfigured() {
        return geminiApiKey != null && !geminiApiKey.trim().isEmpty();
    }

    public String generateEmailReply(EmailRequest emailRequest) {
        if (emailRequest == null || emailRequest.getEmailContent() == null || emailRequest.getEmailContent().trim().isEmpty()) {
            return "Please provide email content to generate a reply.";
        }

        String keyToUse = (emailRequest.getApiKey() != null && !emailRequest.getApiKey().trim().isEmpty())
                ? emailRequest.getApiKey().trim()
                : (this.geminiApiKey != null ? this.geminiApiKey.trim() : "");

        if (keyToUse.isEmpty()) {
            return "Error: Gemini API key is not configured. Please set the GEMINI_KEY environment variable on the server, or enter your Gemini API key in the application Settings.";
        }

        // Build the prompt
        String prompt = buildPrompt(emailRequest);

        // Create request body
        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        // Send request and get response
        try {
            String targetUrl = geminiApiUrl + keyToUse;
            String response = webClient.post()
                    .uri(targetUrl)
                    .header("Content-Type", "application/json")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            // Extract response
            return extractResponseContent(response);
        } catch (WebClientResponseException e) {
            return "Gemini API Error (" + e.getStatusCode() + "): " + e.getResponseBodyAsString();
        } catch (Exception e) {
            return "Error communicating with AI service: " + e.getMessage();
        }
    }

    private String extractResponseContent(String response) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(response);

            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }

            // Check if there is an error node in the response
            JsonNode errorNode = rootNode.path("error");
            if (!errorNode.isMissingNode()) {
                return "Gemini Error: " + errorNode.path("message").asText();
            }

            return "Unable to parse response from Gemini API: " + response;
        } catch (Exception e) {
            return "Error processing response: " + e.getMessage();
        }
    }

    private String buildPrompt(EmailRequest emailRequest) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an expert executive email assistant. Generate a high-quality email reply for the following received email.\n");
        prompt.append("Do NOT generate a subject line. Only generate the body of the reply.\n");

        if (emailRequest.getTone() != null && !emailRequest.getTone().trim().isEmpty()) {
            prompt.append("Tone: ").append(emailRequest.getTone()).append(".\n");
        }
        if (emailRequest.getLength() != null && !emailRequest.getLength().trim().isEmpty()) {
            prompt.append("Length: ").append(emailRequest.getLength()).append(".\n");
        }
        if (emailRequest.getAdditionalInstructions() != null && !emailRequest.getAdditionalInstructions().trim().isEmpty()) {
            prompt.append("Special instructions: ").append(emailRequest.getAdditionalInstructions()).append(".\n");
        }

        prompt.append("\nOriginal email:\n").append(emailRequest.getEmailContent());

        return prompt.toString();
    }
}
