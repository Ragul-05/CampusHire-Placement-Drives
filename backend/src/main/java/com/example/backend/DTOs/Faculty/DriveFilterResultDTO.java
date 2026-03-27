package com.example.backend.DTOs.Faculty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriveFilterResultDTO {
    private FacultyDriveDTO drive;
    private Long totalVerified;
    private List<FacultyStudentDTO> eligibleStudents;
    private Map<Long, List<String>> ineligibleReasons;
}
