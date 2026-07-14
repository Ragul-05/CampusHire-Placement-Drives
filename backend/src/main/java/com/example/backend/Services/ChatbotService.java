package com.example.backend.Services;

import com.example.backend.DTOs.Chatbot.ChatbotCardDTO;
import com.example.backend.DTOs.Chatbot.ChatbotResponseDTO;
import com.example.backend.DTOs.Admin.AnalyticsResponseDTO;
import com.example.backend.DTOs.Admin.DashboardStatsDTO;
import com.example.backend.DTOs.Faculty.FacultyAnalyticsDTO;
import com.example.backend.DTOs.Faculty.FacultyDriveDTO;
import com.example.backend.DTOs.Faculty.FacultyStudentDTO;
import com.example.backend.DTOs.Offers.OfferFilterResponseDTO;
import com.example.backend.DTOs.Results.PlacementResultsResponseDTO;
import com.example.backend.DTOs.StudentAnnouncementDTO;
import com.example.backend.DTOs.StudentEventDTO;
import com.example.backend.DTOs.StudentOfferDTO;
import com.example.backend.DTOs.StudentProfileDto;
import com.example.backend.Models.ChatbotLog;
import com.example.backend.Models.User;
import com.example.backend.Models.enums.Role;
import com.example.backend.Repositories.ChatbotLogRepository;
import com.example.backend.Repositories.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class ChatbotService {

    private static final Pattern OFFER_PATTERN = Pattern.compile("\\boffer(s)?\\b|accepted offer|current selected company", Pattern.CASE_INSENSITIVE);
    private static final Pattern PROFILE_PATTERN = Pattern.compile("\\bprofile|completion|verified|verification\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern DRIVE_PATTERN = Pattern.compile("\\bdrive(s)?|eligible drive|eligib\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern STAGE_PATTERN = Pattern.compile("\\bstage|round|interview\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANNOUNCEMENT_PATTERN = Pattern.compile("\\bannouncement(s)?|event(s)?\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ANALYTICS_PATTERN = Pattern.compile("\\banalytic(s)?|placement percentage|highest package|top recruiter\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern FACULTY_PATTERN = Pattern.compile("\\bpending verifications|verified students|rejected students|approval|department\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern ADMIN_PATTERN = Pattern.compile("\\ball placement results|active drives|unplaced|multiple offers|report\\b", Pattern.CASE_INSENSITIVE);

    private final StudentProfileService studentProfileService;
    private final StudentOfferService studentOfferService;
    private final StudentDriveService studentDriveService;
    private final StudentAnnouncementService studentAnnouncementService;
    private final FacultyStudentService facultyStudentService;
    private final FacultyDriveFilteringService facultyDriveFilteringService;
    private final PlacementResultsService placementResultsService;
    private final AdminDashboardService adminDashboardService;
    private final AdminAnalyticsService adminAnalyticsService;
    private final OfferFilterService offerFilterService;
    private final FacultyAnalyticsService facultyAnalyticsService;
    private final GeminiService geminiService;
    private final PromptService promptService;
    private final UserRepository userRepository;
    private final ChatbotLogRepository chatbotLogRepository;

    public ChatbotService(
            StudentProfileService studentProfileService,
            StudentOfferService studentOfferService,
            StudentDriveService studentDriveService,
            StudentAnnouncementService studentAnnouncementService,
            FacultyStudentService facultyStudentService,
            FacultyDriveFilteringService facultyDriveFilteringService,
            PlacementResultsService placementResultsService,
            AdminDashboardService adminDashboardService,
            AdminAnalyticsService adminAnalyticsService,
            OfferFilterService offerFilterService,
            FacultyAnalyticsService facultyAnalyticsService,
            GeminiService geminiService,
            PromptService promptService,
            UserRepository userRepository,
            ChatbotLogRepository chatbotLogRepository) {
        this.studentProfileService = studentProfileService;
        this.studentOfferService = studentOfferService;
        this.studentDriveService = studentDriveService;
        this.studentAnnouncementService = studentAnnouncementService;
        this.facultyStudentService = facultyStudentService;
        this.facultyDriveFilteringService = facultyDriveFilteringService;
        this.placementResultsService = placementResultsService;
        this.adminDashboardService = adminDashboardService;
        this.adminAnalyticsService = adminAnalyticsService;
        this.offerFilterService = offerFilterService;
        this.facultyAnalyticsService = facultyAnalyticsService;
        this.geminiService = geminiService;
        this.promptService = promptService;
        this.userRepository = userRepository;
        this.chatbotLogRepository = chatbotLogRepository;
    }

    @Transactional
    public ChatbotResponseDTO handleQuery(String email, String message) {
        User actor = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Role role = actor.getRole();
        String normalized = message == null ? "" : message.trim();
        String intent = detectIntent(normalized, role);

        ChatbotResponseDTO response = switch (role) {
            case STUDENT -> handleStudentQuery(actor, normalized, intent);
            case FACULTY -> handleFacultyQuery(actor, normalized, intent);
            case PLACEMENT_HEAD -> handleAdminQuery(actor, normalized, intent);
        };

        chatbotLogRepository.save(ChatbotLog.builder()
                .actor(actor)
                .role(role.name())
                .query(normalized)
                .response(response.getReply())
                .timestamp(LocalDateTime.now())
                .build());

        return response;
    }

    private ChatbotResponseDTO handleStudentQuery(User actor, String message, String intent) {
        String email = actor.getEmail();

        if (intent.equals("profile")) {
            StudentProfileDto profile = studentProfileService.getProfileByEmail(email);
            return ChatbotResponseDTO.builder()
                    .role("STUDENT")
                    .intent(intent)
                    .reply(buildStudentProfileReply(profile))
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildProfileCard(profile)))
                    .suggestions(studentSuggestions())
                    .build();
        }

        if (intent.equals("offer")) {
            List<StudentOfferDTO> offers = studentOfferService.getMyOffers(email);
            if (offers.isEmpty()) {
                return ChatbotResponseDTO.builder()
                        .role("STUDENT")
                        .intent(intent)
                        .reply("You currently don't have any offer.\nPlease wait until the Placement Officer updates your status.")
                        .usedGemini(false)
                        .noData(true)
                        .suggestions(studentSuggestions())
                        .build();
            }

            return ChatbotResponseDTO.builder()
                    .role("STUDENT")
                    .intent(intent)
                    .reply(buildOfferReply(offers))
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildOffersCard(offers)))
                    .suggestions(studentSuggestions())
                    .build();
        }

        if (intent.equals("drive")) {
            List<?> drives = studentDriveService.getEligibleDrives(email);
            return buildDriveReply("STUDENT", intent, drives, studentSuggestions());
        }

        if (intent.equals("announcement")) {
            List<StudentAnnouncementDTO> announcements = studentAnnouncementService.getAnnouncementsForStudent(email);
            return buildAnnouncementReply("STUDENT", intent, announcements.stream().map(this::announcementRow).toList(), studentSuggestions());
        }

        if (intent.equals("event")) {
            List<StudentEventDTO> events = studentAnnouncementService.getEventsForStudent(email);
            return buildSimpleCardReply("STUDENT", intent, "Events", events.stream().map(this::eventRow).toList(), studentSuggestions(), "No matching records were found.");
        }

        if (intent.equals("stage")) {
            StudentProfileDto profile = studentProfileService.getProfileByEmail(email);
            String reply = "Your current verification status is " + safe(profile.getVerificationStatus())
                    + ". Current placement status: " + yesNo(profile.getIsPlaced())
                    + ". Offers received: " + safe(profile.getNumberOfOffers()) + ".";
            return ChatbotResponseDTO.builder()
                    .role("STUDENT")
                    .intent(intent)
                    .reply(reply)
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildStageCard(profile)))
                    .suggestions(studentSuggestions())
                    .build();
        }

        return geminiFallback("STUDENT", intent, message, studentSuggestions());
    }

    private ChatbotResponseDTO handleFacultyQuery(User actor, String message, String intent) {
        String email = actor.getEmail();

        if (intent.equals("verification")) {
            List<FacultyStudentDTO> pending = facultyStudentService.getPendingStudents(email);
            return buildStudentCardReply("FACULTY", intent, "Pending Verifications", pending, facultySuggestions());
        }

        if (intent.equals("student")) {
            List<FacultyStudentDTO> verified = facultyStudentService.getDepartmentStudents(email, "VERIFIED");
            return buildStudentCardReply("FACULTY", intent, "Verified Students", verified, facultySuggestions());
        }

        if (intent.equals("drive")) {
            List<FacultyDriveDTO> drives = facultyDriveFilteringService.getAllDrivesForFaculty(email);
            return buildDriveReply("FACULTY", intent, drives, facultySuggestions());
        }

        if (intent.equals("placement")) {
            PlacementResultsResponseDTO placement = placementResultsService.getFacultyPlacementResults(email);
            return ChatbotResponseDTO.builder()
                    .role("FACULTY")
                    .intent(intent)
                    .reply(buildPlacementReply(placement.getSummary().getPlacementPercentage(), placement.getSummary().getPlacedStudents(), placement.getSummary().getUnplacedStudents()))
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildPlacementResultsCard(placement)))
                    .suggestions(facultySuggestions())
                    .build();
        }

        if (intent.equals("analytics")) {
            FacultyAnalyticsDTO analytics = facultyAnalyticsService.getDepartmentAnalytics(email);
            return ChatbotResponseDTO.builder()
                    .role("FACULTY")
                    .intent(intent)
                    .reply("Department placement percentage is " + safe(analytics.getPlacementPercentage()) + "%.")
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildFacultyAnalyticsCard(analytics)))
                    .suggestions(facultySuggestions())
                    .build();
        }

        if (intent.equals("offer")) {
            OfferFilterResponseDTO filters = offerFilterService.getFacultyOfferFilters(email, null);
            return ChatbotResponseDTO.builder()
                    .role("FACULTY")
                    .intent(intent)
                    .reply("I found offer distribution data for your department.")
                    .usedGemini(false)
                    .noData(filters.getRows() == null || filters.getRows().isEmpty())
                    .cards(List.of(buildOfferFilterCard(filters)))
                    .suggestions(facultySuggestions())
                    .build();
        }

        return geminiFallback("FACULTY", intent, message, facultySuggestions());
    }

    private ChatbotResponseDTO handleAdminQuery(User actor, String message, String intent) {
        if (intent.equals("drive")) {
            DashboardStatsDTO stats = adminDashboardService.getDashboardStats();
            return ChatbotResponseDTO.builder()
                    .role("PLACEMENT_HEAD")
                    .intent(intent)
                    .reply("Active drives: " + stats.getOngoingDrives() + ". Completed drives: " + stats.getCompletedDrives() + ".")
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildAdminDashboardCard(stats)))
                    .suggestions(adminSuggestions())
                    .build();
        }

        if (intent.equals("placement") || intent.equals("analytics")) {
            PlacementResultsResponseDTO placement = placementResultsService.getAdminPlacementResults();
            AnalyticsResponseDTO analytics = adminAnalyticsService.getPlacementAnalytics();
            return ChatbotResponseDTO.builder()
                    .role("PLACEMENT_HEAD")
                    .intent(intent)
                    .reply(buildPlacementReply(placement.getSummary().getPlacementPercentage(), placement.getSummary().getPlacedStudents(), placement.getSummary().getUnplacedStudents()))
                    .usedGemini(false)
                    .noData(false)
                    .cards(List.of(buildAdminAnalyticsCard(analytics), buildPlacementResultsCard(placement)))
                    .suggestions(adminSuggestions())
                    .build();
        }

        if (intent.equals("offer")) {
            OfferFilterResponseDTO filters = offerFilterService.getAdminOfferFilters(null);
            return ChatbotResponseDTO.builder()
                    .role("PLACEMENT_HEAD")
                    .intent(intent)
                    .reply("I found offer distribution data across the system.")
                    .usedGemini(false)
                    .noData(filters.getRows() == null || filters.getRows().isEmpty())
                    .cards(List.of(buildOfferFilterCard(filters)))
                    .suggestions(adminSuggestions())
                    .build();
        }

        return geminiFallback("PLACEMENT_HEAD", intent, message, adminSuggestions());
    }

    private ChatbotResponseDTO geminiFallback(String role, String intent, String message, List<String> suggestions) {
        String reply = geminiService.generateResponse(promptService.buildGeneralPrompt(Role.valueOf(role), message));
        return ChatbotResponseDTO.builder()
                .role(role)
                .intent(intent)
                .reply(reply)
                .usedGemini(true)
                .noData(false)
                .suggestions(suggestions)
                .build();
    }

    private String detectIntent(String message, Role role) {
        String text = message == null ? "" : message.toLowerCase(Locale.ENGLISH);
        if (ANNOUNCEMENT_PATTERN.matcher(text).find()) {
            return text.contains("event") ? "event" : "announcement";
        }
        if (OFFER_PATTERN.matcher(text).find()) return "offer";
        if (STAGE_PATTERN.matcher(text).find()) return "stage";
        if (DRIVE_PATTERN.matcher(text).find()) return "drive";
        if (ANALYTICS_PATTERN.matcher(text).find()) return "analytics";
        if (role == Role.FACULTY && FACULTY_PATTERN.matcher(text).find()) {
            return text.contains("student") ? "student" : "verification";
        }
        if (role == Role.PLACEMENT_HEAD && ADMIN_PATTERN.matcher(text).find()) {
            return text.contains("drive") ? "drive" : "placement";
        }
        if (PROFILE_PATTERN.matcher(text).find()) return "profile";
        if (text.contains("company") || text.contains("selected") || text.contains("placed")) {
            return role == Role.STUDENT ? "stage" : "placement";
        }
        return "general";
    }

    private ChatbotResponseDTO buildStudentCardReply(String role, String intent, String title, List<FacultyStudentDTO> students, List<String> suggestions) {
        if (students == null || students.isEmpty()) {
            return ChatbotResponseDTO.builder()
                    .role(role)
                    .intent(intent)
                    .reply("No matching records were found.")
                    .usedGemini(false)
                    .noData(true)
                    .suggestions(suggestions)
                    .build();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (FacultyStudentDTO student : students) {
            rows.add(Map.of(
                    "Name", safe(student.getName()),
                    "Email", safe(student.getEmail()),
                    "Status", safe(student.getVerificationStatus()),
                    "Placed", yesNo(student.getIsPlaced())
            ));
        }

        return ChatbotResponseDTO.builder()
                .role(role)
                .intent(intent)
                .reply("I found " + students.size() + " student record(s).")
                .usedGemini(false)
                .noData(false)
                .cards(List.of(ChatbotCardDTO.builder().title(title).rows(rows).build()))
                .suggestions(suggestions)
                .build();
    }

    private ChatbotResponseDTO buildDriveReply(String role, String intent, List<?> drives, List<String> suggestions) {
        if (drives == null || drives.isEmpty()) {
            return ChatbotResponseDTO.builder()
                    .role(role)
                    .intent(intent)
                    .reply("No matching records were found.")
                    .usedGemini(false)
                    .noData(true)
                    .suggestions(suggestions)
                    .build();
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Object item : drives) {
            if (item instanceof FacultyDriveDTO drive) {
                rows.add(Map.of(
                        "Company", safe(drive.getCompanyName()),
                        "Title", safe(drive.getTitle()),
                        "Role", safe(drive.getRole()),
                        "CTC", drive.getCtcLpa() != null ? drive.getCtcLpa() + " LPA" : "N/A",
                        "Status", safe(drive.getStatus())
                ));
            } else if (item instanceof Map<?, ?> map) {
                rows.add(new LinkedHashMap<>((Map<String, Object>) map));
            } else {
                rows.add(Map.of("Value", item.toString()));
            }
        }

        return ChatbotResponseDTO.builder()
                .role(role)
                .intent(intent)
                .reply("I found " + drives.size() + " drive(s).")
                .usedGemini(false)
                .noData(false)
                .cards(List.of(ChatbotCardDTO.builder().title("Drives").rows(rows).build()))
                .suggestions(suggestions)
                .build();
    }

    private ChatbotResponseDTO buildAnnouncementReply(String role, String intent, List<Map<String, Object>> rows, List<String> suggestions) {
        if (rows == null || rows.isEmpty()) {
            return ChatbotResponseDTO.builder().role(role).intent(intent).reply("No matching records were found.").usedGemini(false).noData(true).suggestions(suggestions).build();
        }
        return ChatbotResponseDTO.builder()
                .role(role)
                .intent(intent)
                .reply("I found " + rows.size() + " announcement(s).")
                .usedGemini(false)
                .noData(false)
                .cards(List.of(ChatbotCardDTO.builder().title("Announcements").rows(rows).build()))
                .suggestions(suggestions)
                .build();
    }

    private ChatbotResponseDTO buildSimpleCardReply(String role, String intent, String title, List<Map<String, Object>> rows, List<String> suggestions, String noDataMessage) {
        if (rows == null || rows.isEmpty()) {
            return ChatbotResponseDTO.builder().role(role).intent(intent).reply(noDataMessage).usedGemini(false).noData(true).suggestions(suggestions).build();
        }
        return ChatbotResponseDTO.builder()
                .role(role)
                .intent(intent)
                .reply("I found " + rows.size() + " record(s).")
                .usedGemini(false)
                .noData(false)
                .cards(List.of(ChatbotCardDTO.builder().title(title).rows(rows).build()))
                .suggestions(suggestions)
                .build();
    }

    private ChatbotCardDTO buildProfileCard(StudentProfileDto profile) {
        return ChatbotCardDTO.builder()
                .title("Profile Summary")
                .rows(List.of(
                        row("Email", profile.getEmail()),
                        row("Verification Status", profile.getVerificationStatus()),
                        row("Profile Completion", profile.getProfileCompletion() != null ? profile.getProfileCompletion() + "%" : "N/A"),
                        row("Placed", yesNo(profile.getIsPlaced())),
                        row("Offers", profile.getNumberOfOffers()),
                        row("Highest Package", profile.getHighestPackageLpa() != null ? profile.getHighestPackageLpa() + " LPA" : "N/A")
                ))
                .build();
    }

    private ChatbotCardDTO buildStageCard(StudentProfileDto profile) {
        return ChatbotCardDTO.builder()
                .title("Placement Status")
                .rows(List.of(
                        row("Verification Status", profile.getVerificationStatus()),
                        row("Placed", yesNo(profile.getIsPlaced())),
                        row("Offers", profile.getNumberOfOffers()),
                        row("Highest Package", profile.getHighestPackageLpa() != null ? profile.getHighestPackageLpa() + " LPA" : "N/A")
                ))
                .build();
    }

    private ChatbotCardDTO buildOffersCard(List<StudentOfferDTO> offers) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (StudentOfferDTO offer : offers) {
            rows.add(Map.of(
                    "Company", safe(offer.getCompanyName()),
                    "Role", safe(offer.getRole()),
                    "Package", offer.getCtcLpa() != null ? offer.getCtcLpa() + " LPA" : "N/A",
                    "Status", safe(offer.getStatus())
            ));
        }

        return ChatbotCardDTO.builder().title("Offer Details").rows(rows).build();
    }

    private ChatbotCardDTO buildPlacementResultsCard(PlacementResultsResponseDTO placement) {
        return ChatbotCardDTO.builder()
                .title("Placement Results")
                .rows(List.of(
                        row("Total Students", placement.getSummary().getTotalStudents()),
                        row("Placed Students", placement.getSummary().getPlacedStudents()),
                        row("Unplaced Students", placement.getSummary().getUnplacedStudents()),
                        row("Placement Percentage", placement.getSummary().getPlacementPercentage() + "%")
                ))
                .build();
    }

    private ChatbotCardDTO buildFacultyAnalyticsCard(FacultyAnalyticsDTO analytics) {
        return ChatbotCardDTO.builder()
                .title("Faculty Analytics")
                .rows(List.of(
                        row("Average Package", analytics.getAveragePackageLpa()),
                        row("Highest Package", analytics.getHighestPackageLpa()),
                        row("Placed Students", analytics.getTotalPlaced()),
                        row("Placement Percentage", analytics.getPlacementPercentage() + "%")
                ))
                .build();
    }

    private ChatbotCardDTO buildAdminAnalyticsCard(AnalyticsResponseDTO analytics) {
        return ChatbotCardDTO.builder()
                .title("Placement Analytics")
                .rows(List.of(
                        row("Placement Rate", analytics.getPlacementRate() + "%"),
                        row("Placed Students", analytics.getTotalPlaced()),
                        row("Verified Students", analytics.getTotalVerified()),
                        row("Total Offers", analytics.getTotalOffers())
                ))
                .build();
    }

    private ChatbotCardDTO buildAdminDashboardCard(DashboardStatsDTO stats) {
        return ChatbotCardDTO.builder()
                .title("System Overview")
                .rows(List.of(
                        row("Total Students", stats.getTotalStudents()),
                        row("Verified Students", stats.getVerifiedStudents()),
                        row("Placed Students", stats.getPlacedStudents()),
                        row("Active Drives", stats.getOngoingDrives()),
                        row("Highest CTC", stats.getHighestCtc()),
                        row("Average CTC", stats.getAverageCtc())
                ))
                .build();
    }

    private ChatbotCardDTO buildOfferFilterCard(OfferFilterResponseDTO filters) {
        List<Map<String, Object>> rows = new ArrayList<>();
        if (filters.getRows() != null) {
            for (var rowDto : filters.getRows()) {
                rows.add(Map.of(
                        "Student", safe(rowDto.getStudentName()),
                        "Offers", rowDto.getOfferCount() != null ? rowDto.getOfferCount() : 0L,
                        "Companies", safe(rowDto.getCompanyNames())
                ));
            }
        }
        return ChatbotCardDTO.builder().title("Offer Filters").rows(rows).build();
    }

    private Map<String, Object> row(String key, Object value) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put(key, value != null ? value : "N/A");
        return row;
    }

    private Map<String, Object> announcementRow(StudentAnnouncementDTO dto) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("Title", safe(dto.getTitle()));
        row.put("Scope", safe(dto.getScope()));
        row.put("Posted By", safe(dto.getPostedByName()));
        row.put("Date", dto.getCreatedAt() != null ? dto.getCreatedAt().toString() : "N/A");
        return row;
    }

    private Map<String, Object> eventRow(StudentEventDTO dto) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("Title", safe(dto.getTitle()));
        row.put("When", dto.getScheduledAt() != null ? dto.getScheduledAt().toString() : "N/A");
        row.put("Location", safe(dto.getLocationOrLink()));
        row.put("Scope", safe(dto.getScope()));
        return row;
    }

    private String buildStudentProfileReply(StudentProfileDto profile) {
        return "Your profile is " + safe(profile.getVerificationStatus())
                + ", completion is " + safe(profile.getProfileCompletion()) + "% and your placement status is "
                + yesNo(profile.getIsPlaced()) + ".";
    }

    private String buildOfferReply(List<StudentOfferDTO> offers) {
        StringBuilder builder = new StringBuilder("You currently have:");
        builder.append("\n").append(offers.size()).append(" offer(s)");
        for (StudentOfferDTO offer : offers) {
            builder.append("\n\n")
                    .append(safe(offer.getCompanyName()))
                    .append("\nRole: ").append(safe(offer.getRole()))
                    .append("\nCTC: ").append(offer.getCtcLpa() != null ? offer.getCtcLpa() + " LPA" : "N/A");
        }
        if (!offers.isEmpty()) {
            builder.append("\n\nCurrent Selected Company: ").append(safe(offers.get(0).getCompanyName()));
        }
        return builder.toString();
    }

    private String buildPlacementReply(Object percentage, Object placed, Object unplaced) {
        return "Placement status summary: " + placed + " placed, " + unplaced + " unplaced, placement percentage " + percentage + "%";
    }

    private List<String> studentSuggestions() {
        return List.of("Show my profile", "Show my offers", "What drives am I eligible for?", "Show my current interview stage", "What announcements are available?");
    }

    private List<String> facultySuggestions() {
        return List.of("How many pending verifications?", "Show verified students", "Show department placement percentage", "Show drive analytics", "Export verified students");
    }

    private List<String> adminSuggestions() {
        return List.of("How many drives are active?", "Show all placement results", "Show placement percentage", "Which company hired the most students?", "Generate placement report");
    }

    private String safe(Object value) {
        return value == null ? "N/A" : String.valueOf(value);
    }

    private String yesNo(Boolean value) {
        return Boolean.TRUE.equals(value) ? "Yes" : "No";
    }
}