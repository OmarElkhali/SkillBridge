package com.skillbridge.user.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.dto.AdminUserUpdateRequest;
import com.skillbridge.user.dto.UserSummaryResponse;
import com.skillbridge.user.entity.Role;
import com.skillbridge.user.entity.RoleName;
import com.skillbridge.user.entity.User;
import com.skillbridge.user.repository.RoleRepository;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public UserService(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    public User getCurrentUser(AppUserPrincipal principal) {
        return getById(principal.getId());
    }

    public UserSummaryResponse getCurrentUserSummary(AppUserPrincipal principal) {
        return UserSummaryResponse.from(getCurrentUser(principal));
    }

    public List<UserSummaryResponse> listUsers() {
        return userRepository.findAll().stream().map(UserSummaryResponse::from).toList();
    }

    @Transactional
    public UserSummaryResponse updateUserAssignment(Long userId, AdminUserUpdateRequest request, AppUserPrincipal currentAdmin) {
        User user = getById(userId);

        if (request.role() != null && !request.role().isBlank()) {
            RoleName roleName;
            try {
                roleName = RoleName.valueOf(request.role().trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Role must be USER or ADMIN.");
            }
            if (currentAdmin.getId().equals(user.getId()) && roleName != RoleName.ADMIN) {
                throw new BadRequestException("You cannot remove your own admin role.");
            }
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new BadRequestException("Requested role is not configured."));
            user.setRole(role);
        }

        if (request.active() != null) {
            if (currentAdmin.getId().equals(user.getId()) && !request.active()) {
                throw new BadRequestException("You cannot deactivate your own account.");
            }
            user.setActive(request.active());
        }

        return UserSummaryResponse.from(userRepository.save(user));
    }
}
