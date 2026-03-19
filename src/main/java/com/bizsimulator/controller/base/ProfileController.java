package com.bizsimulator.controller.base;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/profile")
public class ProfileController {

    @GetMapping
    public String getProfile(Model model, Authentication authentication) {
        if(authentication != null && authentication.isAuthenticated()) {
            model.addAttribute("username", authentication.getName());
        }
        model.addAttribute("pageTitle", "Мой профиль");
        model.addAttribute("pageCss", "/css/profile.css");
        return "profile/view";
    }

    @GetMapping("/edit")
    public String editProfile(Model model) {
        model.addAttribute("pageTitle", "Изменение профиля");
        model.addAttribute("pageCss", "/css/profile-edit.css");
        return "profile/edit";
    }
}
