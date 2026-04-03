package com.example.backend.DTOs.Faculty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApprovalRequestDTO {
    private Long driveId;
    private List<Long> studentIds;
    private boolean approved;
}
