package com.example.backend.DTOs.Faculty;

import com.example.backend.Models.enums.ApplicationStage;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StageUpdateRequestDTO {
    @NotNull(message = "Stage cannot be null")
    private ApplicationStage targetStage;
}
