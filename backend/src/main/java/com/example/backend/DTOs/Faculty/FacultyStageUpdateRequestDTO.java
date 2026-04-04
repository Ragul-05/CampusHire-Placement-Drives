package com.example.backend.DTOs.Faculty;

import com.example.backend.Models.enums.ApplicationStage;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FacultyStageUpdateRequestDTO {
    @NotNull
    private Long studentId;

    @NotNull
    private Long driveId;

    @NotNull
    private ApplicationStage stage;
}
