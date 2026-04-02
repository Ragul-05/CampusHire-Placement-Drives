package com.example.backend.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseConstraintInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConstraintInitializer.class);

    @Bean
    public ApplicationRunner driveApplicationStageConstraintUpdater(JdbcTemplate jdbcTemplate) {
        return args -> {
            logger.info("Refreshing drive_applications stage constraint to include ELIGIBLE stage");

            jdbcTemplate.execute("ALTER TABLE drive_applications DROP CONSTRAINT IF EXISTS drive_applications_stage_check");
            jdbcTemplate.execute("""
                    ALTER TABLE drive_applications
                    ADD CONSTRAINT drive_applications_stage_check
                    CHECK (stage IN ('ELIGIBLE', 'APPLIED', 'ASSESSMENT', 'TECHNICAL', 'HR', 'SELECTED', 'REJECTED'))
                    """);
        };
    }
}
