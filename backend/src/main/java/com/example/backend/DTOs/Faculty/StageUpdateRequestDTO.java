package com.example.backend.DTOs.Faculty;

import com.example.backend.Models.enums.ApplicationStage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StageUpdateRequestDTO {
    private Long driveId;
    private ApplicationStage targetStage;

    // Helper for controllers that expect "stage" as String
    public String getStage() {
        return targetStage != null ? targetStage.name() : null;
    }
}
