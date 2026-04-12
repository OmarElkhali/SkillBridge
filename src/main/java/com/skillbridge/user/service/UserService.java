package com.skillbridge.user.service;

import com.skillbridge.common.exception.ResourceNotFoundException;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.user.dto.UserSummaryResponse;
import com.skillbridge.user.entity.User;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
}
